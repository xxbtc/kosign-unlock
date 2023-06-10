import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {Container,  Button} from 'react-bootstrap';
import {EncryptionService} from "../services/EncryptionService";
import '../style/unlockPage.css';
import Navbar from "../components/NavbarTop";
import { QrReader } from 'react-qr-reader';
import {AiOutlineQrcode} from 'react-icons/ai';
import {FaCheck} from 'react-icons/fa';
import {MdWarningAmber} from 'react-icons/md';
import {ImKey} from 'react-icons/im';
import Lottie from 'lottie-react-web'
import LottieAnimation from '../animations/5427-scan-qr-code.json'
import {Oval} from 'react-loading-icons';

function UnlockPage() {

    const navigate                                      = useNavigate();
    const [showScanner, setShowScanner]                 = useState(false);
    const [cipherData, setCipherData]                   = useState('');
    const [metadata, setMetadata]                       = useState();
    const [unlockShares, setUnlockShares]               = useState([]);
    const [scanType, setScanType]                       = useState('vault');
    const [numOfQRsScanned, setNumOfQRsScanned]         = useState(0);
    const [numOfQRKEYSsScanned, setNumOfQRKEYSsScanned] = useState(0);
    const [wizardStep, setWizardStep]                   = useState(1);
    const [unlocked, setUnlocked]                       = useState(false);
    const [decryptionResult, setDecryptionResult]       = useState();
    const [isProcessing, setIsProcessing]               = useState(false);
    const [scannedKeys, setScannedKeys]                 = useState([]);
    const [isOnline, setIsOnline]                       = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(navigator.onLine);
        const handleOffline = () => setIsOnline(navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);


    useEffect(()=>{
        if (!metadata) return;
        if (numOfQRsScanned>=metadata.qrcodes) {
            setScanType('key');
        }
    }, [numOfQRsScanned]);

    useEffect(() => {
        if (!metadata) return;
        if (numOfQRKEYSsScanned>=metadata.threshold) {
            unlockVault();
            return;
        }
    },[numOfQRKEYSsScanned]);

    const scannedVault = (data) => {
        let jsonObject  = JSON.parse(data);
        if ((numOfQRsScanned===0) && (jsonObject.id !==1)) {
            alert ('please scan the metadata QR from your vault backup');
            setIsProcessing(false);
            return;
        }

        if (jsonObject.id===1) {
            setMetadata(jsonObject);
        } else {
            if (jsonObject.id !== (numOfQRsScanned+1)) {
                alert ('please scan shard #'+(numOfQRsScanned));
                setIsProcessing(false);
                return;
            }
            setCipherData(cipherData+jsonObject.data);
        }
        setNumOfQRsScanned(jsonObject.id);
        setIsProcessing(false);
    };

    const scannedKey = (data) => {
        if (!data.hasOwnProperty('key')) return;
        if (unlockShares.includes(data.key)) {
            setIsProcessing(false);
            return;
        }

        unlockShares.push(data.key);
        setUnlockShares(unlockShares);

        let tmpScannedKeys = scannedKeys;

        tmpScannedKeys.push(data.ident);
        setScannedKeys(tmpScannedKeys);
        setNumOfQRKEYSsScanned(numOfQRKEYSsScanned+1);
        setIsProcessing(false);
    };


    const scannedSomething = (data, error) => {
        if (error) {
            return;
        }
        if (isProcessing) return;
        if (scanType==='vault') {
            scannedVault(data);
        } else if (scanType==='key'){
            scannedKey(JSON.parse(data));
        }

    };


    const unlockVault = ()=> {
        if (metadata.threshold===1) {
            EncryptionService.decrypt(
                cipherData,
                unlockShares[0],
                metadata.cipherIV
            ).then((decryptionResult) => {
                setUnlocked(true);
                setDecryptionResult(decryptionResult);
            })
        } else {
            EncryptionService.combineShares(unlockShares).then((cipherKey) => {
                EncryptionService.decrypt(
                    cipherData,
                    cipherKey,
                    metadata.cipherIV
                ).then((decryptionResult) => {
                    setUnlocked(true);
                    setDecryptionResult(decryptionResult);
                })
            });
        }
    };


    const getClassType = (index, rowType) => {
        let returnClass = 'unlockrowItem';
        if (scanType==='vault' && rowType==='vault') {
            if (numOfQRsScanned-1>=index) {
                returnClass = returnClass + ' unlockrowItemSuccess';
                return returnClass;
            }
            if (index===numOfQRsScanned) {
                returnClass = returnClass + ' activeQR';
                return returnClass;
            }
        }

        if (scanType==='key' && rowType==='key') {
            let returnClass = 'unlockrowItem';
            if (scannedKeys.includes(metadata.keys[index].alias)) {
                return returnClass + ' unlockrowItemSuccess';
            }
        }

        if (scanType==='key' && rowType==='vault') {
            returnClass = returnClass + ' unlockrowItemSuccess';
        }

        return returnClass;
    };


    const getKeyClass = (keyname) => {
        let returnClass = 'unlockrowItem';
        if (scannedKeys.includes(keyname)) {
            return returnClass + ' unlockrowItemSuccess';
        }
        return returnClass;
    }

    const renderQRReader = () => {
        if (isProcessing) {
            return (<div style={{textAlign:'center', paddingTop:50}}><Oval stroke={'#1786ff'} strokeWidth={15} className={'loading'}  /></div>);
        }

        return (
            <QrReader
                key={'qrreaderkey'+numOfQRsScanned+'_'+scanType+'_'+numOfQRKEYSsScanned}
                onResult={(result, error) => scannedSomething(result?.text, error)}
                containerStyle={{
                    width: '100%',
                    borderRadius: 15,
                    height: 'auto',
                    margin: 'auto',
                    padding: 0,
                    marginTop: 0,
                    background: '#fff'
                }}

                videoStyle={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 15,
                    margin: 0,
                    padding: 0
                }}
            />
        )
    }

    if (unlocked) {
        return (
            <div className={'layoutWrapper'}>
                <Navbar />
                <div className={'pageWrapper'}>
                    <Container>
                        <Row>
                            <Col xs={{span: 12, offset: 0}} md={{span: 12, offset: 0}} lg={{span: 8, offset: 2}}>
                                <div>
                                    <div>
                                        <h2 className={'pageTitle'}>Vault Unlocked</h2>
                                    </div>
                                    <div style={{marginTop: 10, marginBottom:30}}>
                                        <div className={'alert alert-success'}>
                                            Vault contents are displayed below (if you entered your keys correctly)
                                        </div>
                                        <textarea
                                            value={decryptionResult}
                                            disabled={true}
                                            className={'form-control'}
                                            placeholder={''}
                                            style={{height:300}}
                                        />
                                    </div>

                                    <a href={'https://kosign.xyz'}>
                                        <Button
                                            variant={'primary'}
                                            size={'lg'}
                                        >
                                            Close
                                        </Button>
                                    </a>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </div>
        )
    }



    return (
        <div className={'layoutWrapper'}>
            <Navbar />
            <div className={'pageWrapper'}>
                <Container>
                    <Row>
                        <Col xs={{span: 12, offset: 0}} md={{span: 12, offset: 0}} lg={{span: 12, offset: 0}}>
                            <div className={'pageNavWrapper'}>
                                <div>
                                    <h2 className={'pageTitle'}>Unlock your vault</h2>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col xs={{span: 12, offset: 0}} md={{span: 12, offset: 0}} lg={{span: 12, offset: 0}}>
                            <div className={'pageWrapperInner'}>

                                <div>
                                    {wizardStep===  1?
                                        <div>
                                            <Row>
                                                <Col xs={{span: 12, offset: 0}} md={{span: 3, offset: 0}} lg={{span: 3, offset: 0}}>
                                                    <div>
                                                        <Lottie
                                                            options={{
                                                                animationData: LottieAnimation
                                                            }}
                                                            width={200}
                                                            height={200}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col xs={{span: 12, offset: 0}} md={{span: 9, offset: 0}} lg={{span: 9, offset: 0}}>
                                                    <div>
                                                        <div><h4>You will need:</h4></div>
                                                        <div className={'unlockInstruction'}>
                                                            <AiOutlineQrcode className={'unlockIcon'} /> Your vault page
                                                        </div>
                                                        <div className={'unlockInstruction'}>
                                                            <ImKey className={'unlockIcon'} /> Enough keys to unlock
                                                        </div>
                                                    </div>
                                                    {!isOnline ?
                                                        <div className={'alert alert-success'}>
                                                            <FaCheck style={{marginRight: 2, fontSize: 12}}/>
                                                            <b>You are offline</b>
                                                        </div>
                                                        :
                                                        <div className={'alert alert-warning'}>
                                                            <MdWarningAmber style={{marginRight: 8, fontSize: 18, lineHeight:16}}/>
                                                            <b>Disconnect your internet</b>
                                                            <p style={{marginTop: 4, marginBottom: 0}}>For your security, you can disconnect this
                                                                device from the internet and go offline before continuing.</p>
                                                        </div>
                                                    }

                                                    <div  style={{marginTop:20}}>
                                                        <Link to={'#'} onClick={() => setShowScanner(true)}>

                                                            <div>
                                                                <Button
                                                                    variant={'primary'}
                                                                    size={'lg'}
                                                                    style={{width:'100%'}}
                                                                    onClick={() => setWizardStep(wizardStep+1)}
                                                                >
                                                                    Continue
                                                                </Button>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                </Col>
                                            </Row>

                                        </div>
                                        : null
                                    }

                                    {wizardStep === 2 ?
                                        <Row>
                                            <Col xs={{span: 12, offset: 0}} md={{span: 6, offset: 0}} lg={{span: 6, offset: 0}}>
                                                {renderQRReader()}
                                            </Col>
                                            <Col xs={{span: 12, offset: 0}} md={{span: 6, offset: 0}} lg={{span: 6, offset: 0}}>

                                                <div className={'alert alert-info'}>
                                                    <Oval stroke={'#1786ff'} strokeWidth={15} className={'loading'}  />
                                                    {scanType === 'vault' ?
                                                        <span>
                                                            {numOfQRsScanned === 0 ?
                                                                <span>
                                                                    Scan the <b>metadata</b> QR on your vault
                                                                </span>
                                                                :
                                                                <span>
                                                                    Scan <b>shard #{numOfQRsScanned}</b>
                                                                </span>
                                                            }
                                                        </span>
                                                        :
                                                        <span>
                                                            Scan key #{numOfQRKEYSsScanned + 1}-of-{metadata.shares}
                                                        </span>
                                                    }
                                                </div>

                                                {metadata?
                                                <div>
                                                    <h4 style={{overflowWrap:'break-word', marginBottom:20}}>{metadata.vaultName}</h4>

                                                    <div className={'unlockrow'}>
                                                        {[...Array(metadata.qrcodes)].map((_, index) => (
                                                            <div className={getClassType(index, 'vault')} key={'vaultindx'+index}>
                                                                <AiOutlineQrcode className={'qrIcon'} />
                                                                {index===0?<div>Metadata</div>:<div>Shard #{index}</div>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className={'unlockrow'}>
                                                        {[...Array(metadata.shares)].map((_, index) => (
                                                            <div className={getKeyClass(metadata.keys[index])} key={'keyindx'+index}>
                                                                <div style={{display:'flex', flexDirection:'row', flex:1, alignItems:'center', textAlign:'left'}}>
                                                                    <div>
                                                                        <ImKey className={'keyIcon'} />
                                                                    </div>
                                                                    <div>
                                                                       {/* <div>Key #{index+1}</div>*/}
                                                                        <div>{metadata.keys[index]}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            : null}
                                            </Col>
                                        </Row>
                                        : null }
                                </div>

                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    )

}

export default UnlockPage;


