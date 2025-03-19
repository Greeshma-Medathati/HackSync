import React, { useEffect, useRef, useState } from 'react';
import { QrCode } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { adminService } from '../../services/api';
import Loader from '../../components/Loader';

const FoodQR = () => {
    const scannerRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        let scanner;

        if (isScanning) {
            scanner = new Html5QrcodeScanner(
                'reader',
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                false
            );

            scanner.render(handleScanSuccess, handleScanError);
        }

        return () => {
            if (scanner) {
                scanner.clear();
            }
        };
    }, [isScanning]);

    // const handleScanSuccess = async (decodedText) => {
    //     console.log('Decoded Meal QR:', decodedText);
    //     setLoading(true);
    //     setSuccess('');
    //     setError('');
    //     setIsScanning(false);  // Stop scanning after success

    //     try {
    //         const response = await adminService.foodQR(decodedText);
    //         setSuccess(response.message || 'Meal confirmed successfully!');
    //     } catch (error) {
    //         setError(error.message || 'Failed to confirm meal');
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const handleScanSuccess = async (decodedText) => {
        console.log('Decoded Meal QR:', decodedText);
        setLoading(true);
        setSuccess('');
        setError('');
        setIsScanning(false);  // Stop scanning after success
    
        try {
            // Ensure decodedText is an object containing _id and foodName
            const qrData = JSON.parse(decodedText); // If QR stores JSON
            console.log('Raw Decoded Text:', decodedText); // Debugging
            if (!qrData._id || !qrData.foodName) {
                throw new Error("Invalid QR code format");
            }
    
            const response = await adminService.foodQR(qrData); // Send object
            setSuccess(response.message || 'Meal confirmed successfully!');
        } catch (error) {
            setError(error.message || 'Failed to confirm meal');
        } finally {
            setLoading(false);
        }
    };
    
    const handleScanError = (error) => {
        console.error('QR Scan Error:', error);
        setError('Error scanning QR code.');
    };

    const handleStartStop = () => {
        setIsScanning(!isScanning);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center lg:h-[70vh] bg-[#191E29]">
                <Loader />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2">
                <QrCode className="h-6 w-6 text-[#01C38D]" />
                <h1 className="text-2xl font-bold text-white">Food QR Check-In</h1>
            </div>
            <div className="border border-[#01C38D] rounded-lg p-4 sm:p-8 bg-[#132D46]">
                <div id="reader" style={{ width: '100%' }} />
                <div className="flex justify-center mt-4">
                    <button
                        onClick={handleStartStop}
                        className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                            isScanning ? 'bg-red-500 hover:bg-red-600' : 'bg-[#01C38D] hover:bg-[#01C38D]/90'
                        }`}
                    >
                        {isScanning ? 'Stop Scanning' : 'Start Scanning'}
                    </button>
                </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
        </div>
    );
};

export default FoodQR;
