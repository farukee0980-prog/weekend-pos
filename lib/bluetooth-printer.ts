// Bluetooth Types for TypeScript
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: {
        filters?: Array<{
          services?: string[];
          namePrefix?: string;
          name?: string;
        }>;
        acceptAllDevices?: boolean;
        optionalServices?: string[];
      }): Promise<BluetoothDevice>;
    };
  }

  interface BluetoothDevice {
    gatt?: BluetoothRemoteGATTServer;
    name?: string;
    id: string;
  }

  interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
  }

  interface BluetoothRemoteGATTService {
    uuid: string;
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    uuid: string;
    properties: {
      write: boolean;
      writeWithoutResponse: boolean;
      read: boolean;
      notify: boolean;
    };
    writeValue(value: ArrayBuffer): Promise<void>;
    writeValueWithoutResponse(value: ArrayBuffer): Promise<void>;
  }
}

import { getAllStoreSettings } from './db/settings';
import { formatDateTime } from './utils';
import type { ReceiptData } from '@/components/pos/receipt';

export class BluetoothPrinter {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  
  // Common UUIDs for thermal printers
  private readonly PRINT_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
  private readonly PRINT_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';
  
  // Alternative UUIDs for different printer brands
  private readonly ALTERNATIVE_SERVICES = [
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Some Chinese printers
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service
  ];

  async connect(): Promise<boolean> {
    try {
      // Check if Web Bluetooth is supported
      if (!navigator.bluetooth) {
        throw new Error('เบราว์เซอร์นี้ไม่รองรับ Web Bluetooth - ใช้ Chrome หรือ Edge เท่านั้น');
      }

      console.log('[Bluetooth] Starting device scan...');
      console.log('[Bluetooth] Available:', 'bluetooth' in navigator);
      
      // Request Bluetooth device with broader filters
      this.device = await navigator.bluetooth.requestDevice({
        // Accept all devices - let user choose
        acceptAllDevices: true,
        optionalServices: [
          this.PRINT_SERVICE_UUID,
          ...this.ALTERNATIVE_SERVICES,
          // Generic services
          '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
          '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip Data
        ]
      });

      console.log('[Bluetooth] Selected device:', this.device.name || this.device.id);
      console.log('[Bluetooth] Device info:', {
        name: this.device.name,
        id: this.device.id
      });

      console.log('[Bluetooth] Connecting to GATT Server...');
      this.server = await this.device.gatt?.connect() || null;
      if (!this.server) {
        throw new Error('ไม่สามารถเชื่อมต่อ GATT Server');
      }

      console.log('[Bluetooth] GATT connected, finding services...');
      
      // Try to find any writable characteristic
      this.characteristic = await this.findWritableCharacteristic();

      if (!this.characteristic) {
        throw new Error('ไม่พบ Characteristic สำหรับการพิมพ์ - เครื่องปริ้นนี้อาจไม่รองรับ');
      }

      console.log('[Bluetooth] Connected successfully!');
      return true;

    } catch (error: any) {
      console.error('[Bluetooth] Connection failed:', error);
      await this.disconnect();
      throw new Error(error.message || 'เชื่อมต่อเครื่องปริ้น Bluetooth ไม่สำเร็จ');
    }
  }

  private async findWritableCharacteristic(): Promise<BluetoothRemoteGATTCharacteristic | null> {
    if (!this.server) return null;

    console.log('[Bluetooth] Scanning for writable characteristics...');

    try {
      // Get all services
      const services = await this.server.getPrimaryServices();
      console.log('[Bluetooth] Found services:', services.length);

      for (const service of services) {
        try {
          console.log('[Bluetooth] Checking service:', service.uuid);
          const characteristics = await service.getCharacteristics();
          
          for (const char of characteristics) {
            console.log('[Bluetooth] Found characteristic:', char.uuid, 'Properties:', char.properties);
            
            // Check if characteristic supports writing
            if (char.properties.write || char.properties.writeWithoutResponse) {
              console.log('[Bluetooth] Found writable characteristic:', char.uuid);
              return char;
            }
          }
        } catch (serviceError) {
          console.log('[Bluetooth] Service error:', serviceError);
          continue;
        }
      }
    } catch (error) {
      console.error('[Bluetooth] Error scanning characteristics:', error);
    }

    return null;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.server && this.server.connected) {
        this.server.disconnect();
      }
    } catch (error) {
      console.error('[Bluetooth] Disconnect error:', error);
    } finally {
      this.device = null;
      this.server = null;
      this.characteristic = null;
    }
  }

  async isConnected(): Promise<boolean> {
    return this.server?.connected || false;
  }

  async print(receiptData: ReceiptData): Promise<boolean> {
    try {
      if (!this.characteristic) {
        throw new Error('เครื่องปริ้นไม่ได้เชื่อมต่อ กรุณาเชื่อมต่อก่อน');
      }

      console.log('[Bluetooth] Getting store settings...');
      // Get store settings from database
      const settingsRes = await getAllStoreSettings();
      const settings = settingsRes.data || {};

      console.log('[Bluetooth] Generating ESC/POS data from receipt format...');
      const escPosData = this.generateESCPOSFromReceipt(receiptData, settings);
      
      console.log('[Bluetooth] Sending to printer...');
      
      // Split large data into chunks (some printers have MTU limits)
      const chunkSize = 20; // Bytes per chunk
      const chunks = this.splitIntoChunks(escPosData, chunkSize);
      
      for (let i = 0; i < chunks.length; i++) {
        try {
          // Try writeWithoutResponse first (faster)
          if (this.characteristic.properties.writeWithoutResponse) {
            await this.characteristic.writeValueWithoutResponse(chunks[i]);
          } else {
            await this.characteristic.writeValue(chunks[i]);
          }
        } catch (writeError) {
          console.error(`[Bluetooth] Write error chunk ${i}:`, writeError);
          // Try alternative write method
          await this.characteristic.writeValue(chunks[i]);
        }
        
        // Add small delay between chunks
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      console.log('[Bluetooth] Print sent successfully!');
      return true;

    } catch (error: any) {
      console.error('[Bluetooth] Print failed:', error);
      throw new Error(error.message || 'พิมพ์ใบเสร็จไม่สำเร็จ');
    }
  }

  private splitIntoChunks(data: ArrayBuffer, chunkSize: number): ArrayBuffer[] {
    const chunks: ArrayBuffer[] = [];
    const uint8Array = new Uint8Array(data);
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      chunks.push(chunk.buffer);
    }
    
    return chunks;
  }

  private generateESCPOSFromReceipt(data: ReceiptData, settings: Record<string, string>): ArrayBuffer {
    const commands: number[] = [];
    
    // ESC/POS Control Characters
    const ESC = 0x1B;
    const GS = 0x1D;
    const LF = 0x0A; // Line Feed
    
    // Get settings
    const storeName = settings.store_name || 'ร้านค้าของคุณ';
    const storeAddress = settings.store_address || '';
    const storePhone = settings.store_phone || '';
    const taxId = settings.tax_id || '';
    const receiptFooter = settings.receipt_footer || 'ขอบคุณที่ใช้บริการ';
    
    // Initialize printer
    commands.push(ESC, 0x40);
    
    // Set character encoding to UTF-8
    commands.push(ESC, 0x74, 0x20);
    
    // Set line spacing to very compact
    commands.push(ESC, 0x33, 0x08); // Very tight line spacing (8 dots)
    
    // ==== HEADER (Center Aligned) ====
    commands.push(ESC, 0x61, 0x01); // Center alignment
    
    // Store name (Bold only)
    commands.push(ESC, 0x21, 0x08); // Bold mode only
    this.addText(commands, storeName);
    commands.push(ESC, 0x21, 0x00); // Reset
    commands.push(LF);
    
    // Store details (compact)
    if (storeAddress) {
      this.addText(commands, storeAddress);
      commands.push(LF);
    }
    
    if (storePhone) {
      this.addText(commands, storePhone);
      commands.push(LF);
    }
    
    if (taxId) {
      this.addText(commands, `Tax ID: ${taxId}`);
      commands.push(LF);
    }
    
    // Separator
    this.addText(commands, '--------------------------------');
    commands.push(LF);
    
    // ==== ORDER INFO (Left Aligned) ====
    commands.push(ESC, 0x61, 0x00); // Left align
    
    this.addText(commands, `#${data.orderNumber}`);
    commands.push(LF);
    this.addText(commands, formatDateTime(data.createdAt));
    commands.push(LF);
    this.addText(commands, '--------------------------------');
    commands.push(LF);
    
    // ==== ITEMS ====
    data.items.forEach((item) => {
      // Format: "ชื่อสินค้า    จำนวน   ราคา"
      const itemName = item.product_name.length > 16 
        ? item.product_name.substring(0, 16) 
        : item.product_name;
      const qty = `x${item.quantity}`;
      const price = (item.price * item.quantity).toFixed(0);
      
      // Left aligned item name
      commands.push(ESC, 0x61, 0x00);
      this.addText(commands, itemName);
      commands.push(LF);
      
      // Right aligned quantity and price on same line
      commands.push(ESC, 0x61, 0x02);
      this.addText(commands, `${qty}  ${price}`);
      commands.push(LF);
      
      // Note if exists
      if (item.note) {
        commands.push(ESC, 0x61, 0x00);
        this.addText(commands, `  *${item.note}`);
        commands.push(LF);
      }
    });
    
    // ==== SUMMARY ====
    this.addText(commands, '--------------------------------');
    commands.push(LF);
    
    // Subtotal (Right aligned)
    commands.push(ESC, 0x61, 0x00); // Left align label
    this.addText(commands, `Subtotal`);
    commands.push(ESC, 0x61, 0x02); // Right align value
    this.addText(commands, `${data.subtotal.toFixed(0)}`);
    commands.push(LF);
    
    if (data.pointsDiscount && data.pointsDiscount > 0) {
      commands.push(ESC, 0x61, 0x00);
      this.addText(commands, `Points`);
      commands.push(ESC, 0x61, 0x02);
      this.addText(commands, `-${data.pointsDiscount.toFixed(0)}`);
      commands.push(LF);
    }
    
    if (data.discount > 0) {
      commands.push(ESC, 0x61, 0x00);
      this.addText(commands, `Discount`);
      commands.push(ESC, 0x61, 0x02);
      this.addText(commands, `-${data.discount.toFixed(0)}`);
      commands.push(LF);
    }
    
    this.addText(commands, '--------------------------------');
    commands.push(LF);
    
    // Total (Bold)
    commands.push(ESC, 0x21, 0x08); // Bold mode
    commands.push(ESC, 0x61, 0x00);
    this.addText(commands, `TOTAL`);
    commands.push(ESC, 0x61, 0x02);
    this.addText(commands, `${data.total.toFixed(0)}`);
    commands.push(ESC, 0x21, 0x00); // Reset
    commands.push(LF);
    
    // ==== PAYMENT ====
    this.addText(commands, '--------------------------------');
    commands.push(LF);
    
    commands.push(ESC, 0x61, 0x00); // Left align
    const paymentMethod = data.paymentMethod === 'cash' ? 'Cash' : 'Transfer';
    this.addText(commands, `Pay: ${paymentMethod}`);
    commands.push(LF);
    
    if (data.paymentMethod === 'cash' && data.received) {
      commands.push(ESC, 0x61, 0x00);
      this.addText(commands, `Received`);
      commands.push(ESC, 0x61, 0x02);
      this.addText(commands, `${data.received.toFixed(0)}`);
      commands.push(LF);
      
      commands.push(ESC, 0x61, 0x00);
      this.addText(commands, `Change`);
      commands.push(ESC, 0x61, 0x02);
      this.addText(commands, `${(data.change || 0).toFixed(0)}`);
      commands.push(LF);
    }
    
    // ==== MEMBER INFO ====
    if (data.member) {
      this.addText(commands, '--------------------------------');
      commands.push(LF);
      
      commands.push(ESC, 0x61, 0x01); // Center
      commands.push(ESC, 0x21, 0x08); // Bold
      this.addText(commands, 'MEMBER');
      commands.push(ESC, 0x21, 0x00); // Reset
      commands.push(LF);
      
      commands.push(ESC, 0x61, 0x00); // Left align
      this.addText(commands, data.member.name);
      commands.push(LF);
      this.addText(commands, data.member.phone);
      commands.push(LF);
      
      if (data.member.points_earned) {
        this.addText(commands, `Earned`);
        commands.push(ESC, 0x61, 0x02);
        this.addText(commands, `+${data.member.points_earned}`);
        commands.push(LF);
      }
      
      if (data.member.points_used) {
        commands.push(ESC, 0x61, 0x00);
        this.addText(commands, `Used`);
        commands.push(ESC, 0x61, 0x02);
        this.addText(commands, `-${data.member.points_used}`);
        commands.push(LF);
      }
      
      commands.push(ESC, 0x61, 0x00);
      this.addText(commands, `Balance`);
      commands.push(ESC, 0x61, 0x02);
      this.addText(commands, `${data.member.points || 0}`);
      commands.push(LF);
    }
    
    // ==== FOOTER (Center Aligned) ====
    this.addText(commands, '--------------------------------');
    commands.push(LF);
    commands.push(ESC, 0x61, 0x01); // Center align
    
    this.addText(commands, receiptFooter);
    commands.push(LF, LF, LF);
    
    // Cut paper
    commands.push(GS, 0x56, 0x00); // Full cut
    
    return new Uint8Array(commands).buffer;
  }
  
  private addText(commands: number[], text: string): void {
    // Convert Thai text to UTF-8 bytes
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    commands.push(...Array.from(bytes));
  }
}

// Create singleton instance
export const bluetoothPrinter = new BluetoothPrinter();