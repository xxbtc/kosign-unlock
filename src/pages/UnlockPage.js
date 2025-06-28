import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Layout from "../components/Layout";
import {Container,  Button, Modal} from 'react-bootstrap';
import {EncryptionService} from "../services/EncryptionService";
import { VAULT_VERSIONS } from '../config/vaultConfig';

import '../style/index.css';
import '../style/createPage.css';
import '../style/forms.css';
import '../style/unlockPage.css';

import Navbar from "../components/NavbarTop";
import { QrReader } from 'react-qr-reader';

import {AiOutlineQrcode} from 'react-icons/ai';

import {FaChevronRight, FaLock, FaLockOpen, FaInfoCircle, FaCheck, FaShieldAlt, FaLightbulb, FaExclamationTriangle, FaCameraRetro} from 'react-icons/fa';
import {MdWarningAmber} from 'react-icons/md';

import {ImKey} from 'react-icons/im';

import Lottie from 'lottie-react-web'
import LottieAnimation from '../animations/5427-scan-qr-code.json'
import LottieAnimationSuccess  from '../animations/97240-success'
import {Oval} from 'react-loading-icons';
import PreparationStep from '../components/PreparationStep';
import VaultMetadata from '../components/VaultMetadata';
import UnlockedVault from '../components/UnlockedVault';

// NEW: Import format-specific components
import SingleQRUnlock from '../components/SingleQRUnlock';
import LegacyMultiQRUnlock from '../components/LegacyMultiQRUnlock';

// Camera utility functions for better mobile support
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

const getCameraConstraints = (preferBack = true) => {
    const isMobile = isMobileDevice();
    
    // Base constraints
    const constraints = {
        audio: false,
        video: {
            width: { ideal: isMobile ? 1920 : 1280 },
            height: { ideal: isMobile ? 1080 : 720 },
            frameRate: { ideal: 30, max: 30 }
        }
    };
    
    // Camera selection - prefer back camera on mobile, front camera on desktop
    if (isMobile && preferBack) {
        // Mobile: prefer back camera for QR scanning
        constraints.video.facingMode = { ideal: 'environment' };
    } else if (!isMobile) {
        // Desktop: typically has better front-facing webcams
        constraints.video.facingMode = { ideal: 'user' };
    } else {
        // Fallback: let browser choose
        constraints.video.facingMode = 'environment';
    }
    
    return constraints;
};

function UnlockPage() {

    const navigate              = useNavigate();
    const [showScanner, setShowScanner] = useState(false);
    const [processing, setProcessing]   = useState(false);
    const [didScanSomething, setDidScanSomething] = useState(false);

    const [scanTitle, setScanTitle]     = useState('Scan Vault Contents');
    const [cipherIV, setCipherIV]       = useState();
    const [cipherData, setCipherData]   = useState('');
    const [metadata, setMetadata]       = useState();
    const [scanMember, setScanMember]   = useState(1);
    const [unlockShares, setUnlockShares] = useState([]);
    const [scanType, setScanType]         = useState('vault');
    const [numOfQRsScanned, setNumOfQRsScanned] = useState(0);
    const [numOfQRKEYSsScanned, setNumOfQRKEYSsScanned] = useState(0);
    const [showScanNextData, setShowScanNextData] = useState(false);
    const [wizardStep, setWizardStep]   = useState(1);
    const [unlocked, setUnlocked] = useState(false);
    const [decryptionResult, setDecryptionResult] = useState();
    const [isProcessing, setIsProcessing] = useState();
    const [keyAliasArray, setKeyAliasArray] = useState([]);
    const [scannedKeys, setScannedKeys] = useState([]);
    const [isOnline, setIsOnline]   = useState(navigator.onLine);
    const [cameraError, setCameraError] = useState(null);
    const [cameraFacing, setCameraFacing] = useState('back'); // 'back' or 'front'

    useEffect(() => {
        const handleOnline = () => setIsOnline(navigator.onLine);
        const handleOffline = () => setIsOnline(navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            cleanupSensitiveData();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(()=>{
        if (!metadata) return;
        
        // NEW: Handle both single QR and legacy multi-QR formats
        const totalVaultQRs = metadata.data ? 1 : metadata.qrcodes;
        
        if (numOfQRsScanned >= totalVaultQRs) {
            console.log(`Scanned ${numOfQRsScanned} of ${totalVaultQRs} vault QRs - transitioning to key scanning`);
            setScanType('key');
        }
    }, [numOfQRsScanned, metadata]);

    useEffect(() => {
        if (!metadata) return;
        //console.log('metadata ', metadata, numOfQRKEYSsScanned);
        if (numOfQRKEYSsScanned>=metadata.threshold) {
            unlockVault();
            return;
        }
    },[numOfQRKEYSsScanned])

    // Auto-scroll to top when wizard step changes
    useEffect(() => {
        // Only scroll if user has scrolled down (more than 100px from top)
        if (window.scrollY > 100) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, [wizardStep]);

    const scannedVault = (data) => {
        let jsonObject = JSON.parse(data);

        if ((numOfQRsScanned===0) && (jsonObject.id !==1)) {
            alert ('please scan the vault QR from your backup');
            setTimeout(() => setIsProcessing(false), 300);
            return;
        }

        if (jsonObject.id===1) {
            // Version validation
            if (!jsonObject.version) {
                // Assume version 1 for backward compatibility
                jsonObject.version = '1';
            } else if (!VAULT_VERSIONS[jsonObject.version]) {
                alert('This vault was created with a newer version of Kosign. Please update your software.');
               // setIsProcessing(false);
               // return;
            }
            
            setMetadata(jsonObject);
            
            // NEW: Check if this is a single QR code format (has data field)
            if (jsonObject.data) {
                console.log('Detected new single QR format - setting cipher data immediately');
                console.log('Single QR vault detected - cipher data length:', jsonObject.data.length);
                setCipherData(jsonObject.data);
                // For single QR format, we've scanned all vault data
                setNumOfQRsScanned(1);
                // Skip to key scanning phase
                setScanType('key');
            } else {
                console.log('Detected legacy multi-QR format - expecting data shards');
                console.log('Legacy vault detected - expected QR codes:', jsonObject.qrcodes);
                // Legacy format - expect separate data shards
                setNumOfQRsScanned(1);
            }
        } else {
            // Legacy format: Handle data shards
            if (jsonObject.id !== (numOfQRsScanned+1)) {
                alert('please scan shard #' + (numOfQRsScanned));
                setTimeout(() => setIsProcessing(false), 300);
                return;
            }
            setCipherData(cipherData+jsonObject.data);
            setNumOfQRsScanned(jsonObject.id);
        }
        
        setTimeout(() => setIsProcessing(false), 300);
    };

    const scannedKey= (data) => {
       // console.log('scanned key ', data);
        //console.log('scanned a key', data);
        //let jsonObject  = JSON.parse(data);
        //setCipherData(cipherData+data);
        if (unlockShares.includes(data.key)) {
            setTimeout(() => setIsProcessing(false), 300);
            return;
        }

        // Fix: Use spread operator to create new arrays instead of mutating existing ones
        const newUnlockShares = [...unlockShares, data.key];
        setUnlockShares(newUnlockShares);

        const newScannedKeys = [...scannedKeys, data.ident];
        setScannedKeys(newScannedKeys);
        
        console.log('Key scanned:', data.ident);
        console.log('Total keys scanned:', newScannedKeys.length);
        console.log('Threshold needed:', metadata?.threshold);
        
        setNumOfQRKEYSsScanned(numOfQRKEYSsScanned+1);
        setTimeout(() => setIsProcessing(false), 300);
    }


    const scannedSomething = (data, error) => {
        if (error) {
            // Only handle actual camera/permission errors, not scanning errors
            if (error.name === 'NotAllowedError' || 
                error.name === 'NotFoundError' || 
                error.name === 'NotReadableError' || 
                error.name === 'OverconstrainedError') {
                
                console.log('Camera Error:', error);
                
                if (error.name === 'NotAllowedError') {
                    setCameraError('Camera permission denied. Please allow camera access and refresh the page.');
                } else if (error.name === 'NotFoundError') {
                    setCameraError('No camera found. Please check your device camera.');
                } else if (error.name === 'NotReadableError') {
                    setCameraError('Camera is already in use by another application.');
                } else if (error.name === 'OverconstrainedError') {
                    setCameraError('Camera constraints cannot be satisfied. Try switching cameras.');
                }
            }
            // Ignore other errors (like "No QR code found" - these are normal)
            return;
        }
        
        // Clear any previous camera errors when we get successful data
        setCameraError(null);
        
        if (isProcessing) return;
        setIsProcessing(true);

        if (scanType==='vault') {
            scannedVault(data);
        } else if (scanType==='key'){
            scannedKey(JSON.parse(data));
        }
    };

    const switchCamera = () => {
        setCameraFacing(cameraFacing === 'back' ? 'front' : 'back');
        setCameraError(null); // Clear any existing errors when switching
    };


    const unlockVault = ()=> {
        if (metadata.threshold===1) {
            EncryptionService.decrypt(
                cipherData,
                unlockShares[0],
                metadata.cipherIV,
                metadata.version 
            ).then((decryptionResult) => {
                setUnlocked(true);
                setDecryptionResult(decryptionResult);
            }).catch(error => {
                alert('Decryption failed: ' + error.message);
                setUnlocked(false);
            });
        } else {
            EncryptionService.combineShares(unlockShares).then((cipherKey) => {
                EncryptionService.decrypt(
                    cipherData,
                    cipherKey,
                    metadata.cipherIV,
                    metadata.version 
                ).then((decryptionResult) => {
                    setUnlocked(true);
                    setDecryptionResult(decryptionResult);
                }).catch(error => {
                    alert('Decryption failed: ' + error.message);
                    setUnlocked(false);
                });
            });
        }
    };


    const getClassType = (index, rowType) => {
        let returnClass = ' unlockrowItem ';
        if (scanType==='vault' && rowType==='vault') {
            returnClass = returnClass + ' unlockrowItemVault ';
            if (numOfQRsScanned-1>=index) {
                returnClass = returnClass + ' unlockrowItemSuccess ';
                return returnClass;
            }
            if (index===numOfQRsScanned) {
                returnClass = returnClass + ' activeQR ';
                return returnClass;
            }
           // return returnClass;
        }

        if (scanType==='key' && rowType==='key') {
            let returnClass = ' unlockrowItem ';
            returnClass = returnClass + ' unlockrowItemKey ';
            //console.log('does ',metadata.keys[index].alias, 'equal ', scannedKeys);
            if (scannedKeys.includes(metadata.keys[index].alias)) {
                return returnClass + ' unlockrowItemSuccess ';
            }
            /*if (numOfQRKEYSsScanned-1>=index) {
                returnClass = returnClass + ' unlockrowItemSuccess';
                return returnClass;
            }
            if (index===numOfQRKEYSsScanned) {
                returnClass = returnClass + ' activeQR';
                return returnClass;
            }*/
        }

        if (scanType==='key' && rowType==='vault') {
            returnClass = returnClass + ' unlockrowItemSuccess ';
        }

        return returnClass;
    };

    const getKeyClass = (keyname) => {
        let returnClass = ' unlockrowItem ';
        if (scannedKeys.includes(keyname)) {
            return returnClass + ' unlockrowItemSuccess ';
        }
        if (scanType === 'key' && !scannedKeys.includes(keyname)) {
            return returnClass + ' activeQR ';
        }
        return returnClass;
    }

    const InfoTooltip = ({ text }) => (
        <span className="info-tooltip">
            <FaInfoCircle className="ms-2" style={{ fontSize: 14, color: '#6c757d', cursor: 'help' }} />
            <span className="tooltip-text">{text}</span>
        </span>
    );

    const cleanupSensitiveData = () => {
        // Overwrite sensitive data with random data before nulling
        const randomData = Array(1000).fill(0).map(() => Math.random().toString(36));
        
        // Overwrite and null all sensitive state
        setDecryptionResult(randomData.join(''));
        setUnlockShares(randomData);
        setCipherData(randomData.join(''));
        setMetadata(null);
        
        // Clear temporary scanning data
        setScannedKeys([]);
        setNumOfQRsScanned(0);
        setNumOfQRKEYSsScanned(0);
        
        // Force a second overwrite with nulls
        setTimeout(() => {
            setDecryptionResult(null);
            setUnlockShares([]);
            setCipherData('');
        }, 0);
    };

    // Helper functions for dynamic progress calculation
    const getTotalVaultQRs = () => {
        if (!metadata) return 1;
        return metadata.data ? 1 : metadata.qrcodes;
    };

    const getTotalQRsNeeded = () => {
        if (!metadata) return 1;
        const vaultQRs = metadata.data ? 1 : metadata.qrcodes;
        return vaultQRs + metadata.threshold;
    };

    const getCurrentProgress = () => {
        if (!metadata) return 0;
        return numOfQRsScanned + numOfQRKEYSsScanned;
    };

    const getVaultFormatInfo = () => {
        if (!metadata) return 'Unknown';
        return metadata.data ? 'Single QR Format' : 'Legacy Multi-QR Format';
    };

    // NEW: Vault format detection and manual override
    const [forceFormat, setForceFormat] = useState(null); // 'single' or 'legacy'
    
    const getVaultFormat = () => {
        // If user manually selected a format, use that
        if (forceFormat) return forceFormat;
        
        // If no metadata yet, default to single QR format (v2)
        if (!metadata) return 'single';
        
        // Once metadata is scanned, detect format automatically
        return metadata.data ? 'single' : 'legacy';
    };

    const isUsingUnifiedComponent = () => {
        return getVaultFormat() === 'single';
    };

    if (unlocked) {
        return (
            <Layout>
                <Navbar />
                <div className={'pageWrapper'}>
                    <div className="unlock-layout">
                        {/* Main Content Area */}
                        <div className="unlock-main-content">
                            <div className="content-container">
                                <UnlockedVault 
                                    decryptionResult={decryptionResult}
                                    onClose={() => {
                                        cleanupSensitiveData();
                                        setUnlocked(false);
                                        setWizardStep(1);
                                        navigate('/');
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        )
    }



    return (
        <Layout>
            <Navbar loggedIn/>
            <div>
                <div className="unlock-layout">
                    
                    
                    {/* Main Content Area */}
                    <div className="unlock-main-content">
                        <div className={`content-container ${wizardStep !== 1 ? 'scanning-mode' : ''}`}>

                            {wizardStep === 1 ? (
                                <PreparationStep 
                                    isOnline={isOnline}
                                    onContinue={() => {
                                        setShowScanner(true);
                                        setWizardStep(wizardStep + 1);
                                    }}
                                />
                            ) : wizardStep === 2 ? (
                                <div className="scanning-wrapper">
                                    {/* NEW: Component routing based on vault format */}
                                    {isUsingUnifiedComponent() ? (
                                        <SingleQRUnlock
                                            metadata={metadata}
                                            numOfQRsScanned={numOfQRsScanned}
                                            numOfQRKEYSsScanned={numOfQRKEYSsScanned}
                                            scanType={scanType}
                                            isProcessing={isProcessing}
                                            cameraError={cameraError}
                                            scannedKeys={scannedKeys}
                                            onScanResult={scannedSomething}
                                            cameraFacing={cameraFacing}
                                            onSwitchCamera={switchCamera}
                                            getCameraConstraints={getCameraConstraints}
                                            isMobileDevice={isMobileDevice()}
                                        />
                                    ) : (
                                        <LegacyMultiQRUnlock
                                            metadata={metadata}
                                            numOfQRsScanned={numOfQRsScanned}
                                            numOfQRKEYSsScanned={numOfQRKEYSsScanned}
                                            scanType={scanType}
                                            isProcessing={isProcessing}
                                            cameraError={cameraError}
                                            scannedKeys={scannedKeys}
                                            onScanResult={scannedSomething}
                                            getClassType={getClassType}
                                            getKeyClass={getKeyClass}
                                            VAULT_VERSIONS={VAULT_VERSIONS}
                                            cameraFacing={cameraFacing}
                                            onSwitchCamera={switchCamera}
                                            getCameraConstraints={getCameraConstraints}
                                            isMobileDevice={isMobileDevice()}
                                        />
                                    )}
                                </div>
                            ) : null}

                            <div className="content-footer">
                                {/* Format Selection - In footer during scanning */}
                                {wizardStep === 2 && !metadata && (
                                    <div className="format-selection-footer">
                                        <span className="format-text">
                                            Vault format: {getVaultFormat() === 'single' ? 'V2' : 'V1 (legacy format)'} • 
                                        </span>
                                        <button 
                                            className="format-link"
                                            onClick={() => setForceFormat(getVaultFormat() === 'single' ? 'legacy' : 'single')}
                                        >
                                            Switch to {getVaultFormat() === 'single' ? 'V1 (legacy format)' : 'V2'}
                                        </button>
                                    </div>
                                )}
                                
                                <div className="" style={{marginTop: 10}}>
                                    <div className="d-flex align-items-center justify-content-center">
                                        <span className="me-2">🛠️</span>
                                        <span className="me-2">This unlock utility is also available on</span>
                                        <a href={'https://github.com/xxbtc/kosign-unlock'} target={'_blank'} rel="noopener noreferrer" className="github-link">
                                            GitHub 
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )

}

export default UnlockPage;


