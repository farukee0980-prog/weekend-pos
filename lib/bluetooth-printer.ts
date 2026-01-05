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

  async print(receiptData: any): Promise<boolean> {
    try {
      if (!this.characteristic) {
        throw new Error('เครื่องปริ้นไม่ได้เชื่อมต่อ กรุณาเชื่อมต่อก่อน');
      }

      console.log('[Bluetooth] Getting store settings...');
      // Get store settings from database
      const settingsRes = await getAllStoreSettings();
      const settings = settingsRes.data || {};
      
      // Merge settings with receipt data
      const dataWithSettings = {
        ...receiptData,
        storeName: settings.store_name || 'ร้านค้าของคุณ',
        storeAddress: settings.store_address || '',
        storePhone: settings.store_phone || '',
        taxId: settings.tax_id || '',
        receiptFooter: settings.footer_message || 'ขอบคุณที่ใช้บริการ',
      };

      console.log('[Bluetooth] Generating ESC/POS data...');
      const escPosData = this.generateESCPOS(dataWithSettings);
      
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

  private generateESCPOS(data: any): ArrayBuffer {
    const commands: number[] = [];
    
    // ESC/POS Control Characters
    const ESC = 0x1B;
    const GS = 0x1D;
    const LF = 0x0A; // Line Feed
    const CR = 0x0D; // Carriage Return
    const FF = 0x0C; // Form Feed
    
    // Get settings synchronously from data (passed from print function)
    const storeName = data.storeName || 'ร้านค้าของคุณ';
    const storeAddress = data.storeAddress || '';
    const storePhone = data.storePhone || '';
    const taxId = data.taxId || '';
    const receiptFooter = data.receiptFooter || 'ขอบคุณที่ใช้บริการ';
    
    // Initialize printer
    commands.push(ESC, 0x40);
    
    // Set character encoding to UTF-8
    commands.push(ESC, 0x74, 0x20);
    
    // Set line spacing
    commands.push(ESC, 0x32); // Default line spacing
    
    // ==== HEADER ====
    // Center alignment
    commands.push(ESC, 0x61, 0x01);
    
    // Store name (double size, bold)
    commands.push(GS, 0x21, 0x11); // Double width and height
    commands.push(ESC, 0x45, 0x01); // Bold on
    this.addText(commands, storeName);
    commands.push(ESC, 0x45, 0x00); // Bold off
    commands.push(LF);
    
    // Reset size
    commands.push(GS, 0x21, 0x00);
    
    // Store details
    if (storeAddress) {
      this.addText(commands, storeAddress);
      commands.push(LF);
    }
    
    if (storePhone) {
      this.addText(commands, `โทร: ${storePhone}`);
      commands.push(LF);
    }
    
    if (taxId) {
      this.addText(commands, `Tax ID: ${taxId}`);
      commands.push(LF);
    }
    
    // Thick separator line
    commands.push(LF);
    this.addText(commands, '================================');
    commands.push(LF);
    
    // ==== ORDER INFO ====
    commands.push(ESC, 0x61, 0x00); // Left align
    
    this.addText(commands, `เลขที่: #${data.orderNumber}`);
    commands.push(LF);
    
    const date = new Date(data.createdAt);
    const dateStr = date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    this.addText(commands, `วันที่: ${dateStr}`);
    commands.push(LF);
    
    // Separator
    this.addText(commands, '--------------------------------');
    commands.push(LF, LF);
    
    // ==== ITEMS ====
    if (data.items && data.items.length > 0) {
      data.items.forEach((item: any) => {
        const itemName = item.product_name || item.name || '';
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const total = quantity * price;
        
        // Item line
        const itemLine = `${quantity}x ${itemName}`;
        this.addText(commands, itemLine);
        commands.push(LF);
        
        // Price line (right aligned)
        commands.push(ESC, 0x61, 0x02); // Right align
        this.addText(commands, `${total.toFixed(2)}`);
        commands.push(LF);
        commands.push(ESC, 0x61, 0x00); // Back to left align
        
        // Note if exists
        if (item.note) {
          this.addText(commands, `  * ${item.note}`);
          commands.push(LF);
        }
        
        commands.push(LF);
      });
    }
    
    // Separator
    this.addText(commands, '--------------------------------');
    commands.push(LF);
    
    // ==== TOTALS ====
    commands.push(ESC, 0x61, 0x02); // Right align
    
    if (data.subtotal !== undefined) {
      this.addText(commands, `รวม: ${data.subtotal.toFixed(2)}`);
      commands.push(LF);
    }
    
    if (data.pointsDiscount && data.pointsDiscount > 0) {
      this.addText(commands, `ส่วนลด (แต้ม): -${data.pointsDiscount.toFixed(2)}`);
      commands.push(LF);
    }
    
    if (data.discount && data.discount > 0) {
      this.addText(commands, `ส่วนลดอื่นๆ: -${data.discount.toFixed(2)}`);
      commands.push(LF);
    }
    
    // Total (Bold)
    commands.push(ESC, 0x45, 0x01); // Bold on
    commands.push(GS, 0x21, 0x01); // Double width
    this.addText(commands, `รวมสุทธิ: ${data.total.toFixed(2)} บาท`);
    commands.push(ESC, 0x45, 0x00); // Bold off
    commands.push(GS, 0x21, 0x00); // Normal size
    commands.push(LF, LF);
    
    // ==== PAYMENT ====
    commands.push(ESC, 0x61, 0x00); // Left align
    
    const paymentMethod = data.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงิน';
    this.addText(commands, `ชำระด้วย: ${paymentMethod}`);
    commands.push(LF);
    
    if (data.paymentMethod === 'cash' && data.received) {
      this.addText(commands, `รับเงิน: ${data.received.toFixed(2)} บาท`);
      commands.push(LF);
      
      const change = data.change || (data.received - data.total);
      this.addText(commands, `เงินทอน: ${change.toFixed(2)} บาท`);
      commands.push(LF);
    }
    
    // ==== MEMBER INFO ====
    if (data.member) {
      commands.push(LF);
      commands.push(ESC, 0x61, 0x01); // Center align
      commands.push(ESC, 0x45, 0x01); // Bold
      this.addText(commands, '** สมาชิก **');
      commands.push(ESC, 0x45, 0x00); // Bold off
      commands.push(LF);
      
      commands.push(ESC, 0x61, 0x00); // Left align
      this.addText(commands, data.member.name);
      commands.push(LF);
      this.addText(commands, data.member.phone);
      commands.push(LF);
      
      if (data.member.points !== undefined) {
        this.addText(commands, `คะแนนคงเหลือ: ${data.member.points} แต้ม`);
        commands.push(LF);
      }
      
      if (data.member.points_earned) {
        this.addText(commands, `ได้แต้ม: +${data.member.points_earned} แต้ม`);
        commands.push(LF);
      }
      
      if (data.member.points_used) {
        this.addText(commands, `ใช้แต้ม: -${data.member.points_used} แต้ม`);
        commands.push(LF);
      }
    }
    
    // ==== FOOTER ====
    commands.push(LF);
    commands.push(ESC, 0x61, 0x01); // Center align
    
    this.addText(commands, receiptFooter);
    commands.push(LF);
    this.addText(commands, 'กรุณาเก็บใบเสร็จไว้เป็นหลักฐาน');
    commands.push(LF, LF, LF, LF, LF);
    
    // Cut paper (add more spacing for cutting)
    commands.push(LF, LF);
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