'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bluetooth, Printer, Loader2, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import { bluetoothPrinter } from '@/lib/bluetooth-printer';
import { ReceiptData } from './receipt';

interface BluetoothPrinterButtonProps {
  receiptData: ReceiptData;
  disabled?: boolean;
  className?: string;
}

export function BluetoothPrinterButton({ 
  receiptData, 
  disabled = false, 
  className = "" 
}: BluetoothPrinterButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if Web Bluetooth is supported
    setIsSupported('bluetooth' in navigator);
    
    // Check connection status
    const checkConnection = async () => {
      try {
        const connected = await bluetoothPrinter.isConnected();
        setIsConnected(connected);
      } catch (err) {
        setIsConnected(false);
      }
    };
    
    checkConnection();
  }, []);

  const handleConnect = async () => {
    if (!isSupported) {
      setError('เบราว์เซอร์นี้ไม่รองรับ Bluetooth หรือเปิดใช้งานใน Chrome/Edge เท่านั้น');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const connected = await bluetoothPrinter.connect();
      setIsConnected(connected);
      
      if (connected) {
        setError(null);
      }
    } catch (err: any) {
      console.error('[Bluetooth] Connection error:', err);
      setError(err.message || 'เชื่อมต่อเครื่องปริ้นไม่สำเร็จ');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    setError(null);

    try {
      const success = await bluetoothPrinter.print(receiptData);
      
      if (!success) {
        throw new Error('พิมพ์ใบเสร็จไม่สำเร็จ');
      }
    } catch (err: any) {
      console.error('[Bluetooth] Print error:', err);
      setError(err.message || 'พิมพ์ใบเสร็จไม่สำเร็จ');
      
      // Check if still connected
      const connected = await bluetoothPrinter.isConnected();
      setIsConnected(connected);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await bluetoothPrinter.disconnect();
      setIsConnected(false);
      setError(null);
    } catch (err: any) {
      console.error('[Bluetooth] Disconnect error:', err);
    }
  };

  // If not supported, don't render
  if (!isSupported) {
    return (
      <div className={`space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">Bluetooth ไม่รองรับ</span>
        </div>
        <div className="text-sm text-yellow-700 space-y-2">
          <p>เบราว์เซอร์นี้ไม่รองรับ Web Bluetooth</p>
          <div className="bg-white p-3 rounded border-l-4 border-yellow-400">
            <p className="font-medium mb-2">วิธีแก้ไข:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>ใช้ <strong>Chrome หรือ Edge</strong></li>
              <li>พิมพ์ <code className="bg-gray-100 px-1 rounded">chrome://flags</code> ในแถบที่อยู่</li>
              <li>ค้นหา "Experimental Web Platform features"</li>
              <li>เปลี่ยนเป็น <strong>Enabled</strong></li>
              <li>รีสตาร์ทเบราว์เซอร์</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className="text-sm text-gray-600">
          {isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        {!isConnected ? (
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting || disabled}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังเชื่อมต่อ...
              </>
            ) : (
              <>
                <Bluetooth className="w-4 h-4 mr-2" />
                เชื่อมต่อ Bluetooth
              </>
            )}
          </Button>
        ) : (
          <>
            <Button 
              onClick={handlePrint} 
              disabled={isPrinting || disabled}
              size="sm"
              className="flex-1"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังพิมพ์...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 mr-2" />
                  พิมพ์ Bluetooth
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleDisconnect} 
              variant="outline"
              size="sm"
            >
              ตัดการเชื่อมต่อ
            </Button>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {isConnected && !error && !isConnecting && (
        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-800">
            เชื่อมต่อเครื่องปริ้นสำเร็จ พร้อมใช้งาน
          </span>
        </div>
      )}

      {/* Instructions */}
      {!isConnected && !error && !isConnecting && (
        <div className="text-xs text-gray-500 space-y-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            วิธีเชื่อมต่อเครื่องปริ้น:
          </p>
          <p>• เปิด Bluetooth บนเครื่องปริ้นให้อยู่ในโหมด Pairing</p>
          <p>• ใช้เบราว์เซอร์ <strong>Chrome หรือ Edge</strong> เท่านั้น</p>
          <p>• บน Android: เปิด Location/GPS ด้วย</p>
          <p>• ปิด Bluetooth บนอุปกรณ์อื่นที่เชื่อมต่อเครื่องปริ้นอยู่</p>
          <p>• ลองรีสตาร์ทเครื่องปริ้นหากเชื่อมต่อไม่ได้</p>
        </div>
      )}
    </div>
  );
}