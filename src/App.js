import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import MyEpicNFT from "./utils/MyEpicNFT.json";

// Constants
const TWITTER_HANDLE = "timmyisanerd_";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = "https://testnets.opensea.io/collection/timmynft";
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = "0xB0dDa81814730abD6Fe3308C634F599D75Cea5DC";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [mintCount, setMintCount] = useState(0);
  const [NFTmessage, setNFTMessage] = useState("");
  const [NFTlink, setNFTLink] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [networkMessage, setNetworkMessage] = useState("");

  const connectionStatus = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      setNetworkMessage("Make sure you have MetaMask");
      return;
    } else {
      let chainId = await ethereum.request({ method: "eth_chainId" });
      console.log("Connected to chain " + chainId);

      // String, hex code of the chainId of the Rinkebey test network
      const rinkebyChainId = "0x4";
      if (chainId !== rinkebyChainId) {
        setNetworkMessage(
          "You are not connected to the Rinkeby Test Network! Minting isn't possible!"
        );
        return true;
      } else if (chainId === rinkebyChainId) {
        setNetworkMessage("You are connected to the Rinkeby Test Network");
      }
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have MetaMask");
      return;
    } else {
      connectionStatus();
      console.log("Wallet Connected", ethereum);

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        MyEpicNFT.abi,
        signer
      );

      let mintCount = await connectedContract.getTotalNoOfAttempts();
      console.log("Retrieved Total No. of Attempts", mintCount.toNumber());
      setMintCount(mintCount.toNumber());
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    // User can have multiple authorized accounts
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  /*
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
       * Fancy method to request access to account.
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      /*
       * Boom! This should print out public address once we authorize Metamask.
       */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      connectionStatus();

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        MyEpicNFT.abi,
        signer
      );

      let mintCount = await connectedContract.getTotalNoOfAttempts();
      console.log("Retrieved Total No. of Attempts", mintCount.toNumber());
      setMintCount(mintCount.toNumber());
      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  // Setup Our Listener
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          MyEpicNFT.abi,
          signer
        );

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          // alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`);
          setNFTMessage(
            `Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the Link:`
          );
          setNFTLink(
            `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });
        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          MyEpicNFT.abi,
          signer
        );
        setIsMinting(true);
        let mintCount = await connectedContract.getTotalNoOfAttempts();
        console.log("Retrieved Total No. of Attempts", mintCount.toNumber());

        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining Transaction...please wait.");
        await nftTxn.wait();

        mintCount = await connectedContract.getTotalNoOfAttempts();
        console.log("Retrieved Total No. of Attempts", mintCount.toNumber());
        setMintCount(mintCount.toNumber());

        console.log(
          `Transaction Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
        setIsMinting(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const messageStyle = {
    fontSize: "18px",
    margin: "15px auto",
    width: "60%",
  };

  const Rinkeby = () => (
    <div style={messageStyle} className="gradient-text">
      {networkMessage}
    </div>
  );

  useEffect(() => {
    checkIfWalletIsConnected();
  });

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );

  // Render Message
  const NFTMintedMessage = () => {
    return (
      <div style={messageStyle} className="gradient-text">
        {NFTmessage} <br />
        <a href={NFTlink} target="_blank" rel="noopener noreferrer">
          {NFTlink}
        </a>{" "}
        <br />
        <a href={OPENSEA_LINK} target="_blank" rel="noopener noreferrer">
          <button className="cta-button gradient-text"><span role="img" aria-label="waves emoji">🌊</span> View Collection on OpenSea</button>
        </a>
      </div>
    );
  };
  // Loading Animation
  const Loader = () => {
    return (
      <div class="out">
        <div class="fade-in">
          {/* <div class="loader_container">
            <div class="one common"></div>
            <div class="two common"></div>
            <div class="three common"></div>
            <div class="four common"></div>
            <div class="five common"></div>
            <div class="six common"></div>
            <div class="seven common"></div>
            <div class="eight common"></div>
          </div> */}
          <div class="gradient-text">Minting NFT...</div>
          {/* <div class="bar">
            <div class="progress"></div>
          </div> */}
        </div>
      </div>
    );
  };
  // const showLoader = () => {
  //   setIsMinting(true);
  // };
  const MintButton = () => (
    <button
      onClick={askContractToMintNft}
      className="cta-button connect-wallet-button"
    >
      Mint NFT
    </button>
  );
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">Fight Results NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today. <br />
            Total NFT Minted {mintCount}/{TOTAL_MINT_COUNT}{" "}
            <span className="gradient-text">NFTs</span>
          </p>
          {isMinting ? <Loader /> : ""}
          {connectionStatus ? <Rinkeby /> : ""}
          {NFTmessage ? <NFTMintedMessage /> : ""}
          {currentAccount === "" ? (
            <div>{renderNotConnectedContainer()}</div>
          ) : (
            <MintButton />
          )}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >{`@${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
