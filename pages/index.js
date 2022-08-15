import { BigNumber, providers, utils } from "ethers";
import { Doughnut } from 'react-chartjs-2'
import { Chart, ArcElement } from 'chart.js'
Chart.register(ArcElement);

import Head from "next/head";
import Image from 'next/image';
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import {
  addLiquidity,
  removeLiquidity,
  calculateToken,
  getTokensAfterRemove,
  getNbPool,
  fetchAllPools,
  } from "../utils/pool";
import {
  getTokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getDexTokenBalance,
  getEthinPool,
  getTokeninPool,
} from "../utils/getAmounts";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";
import { createProposal, voteForProposal, fetchAllProposals, getNbProposal, executeProposal } from "../utils/dao";
import { progressBar, timeConverter } from "../utils/helper";

const data = {
 labels : ['Yes', 'No'],
 datasets: [{
 label: 'Doughnut chart',
 data: [75, 25],
 backgroundColor: [
 'rgba(60, 179, 113, 0.2)',
 'rgba(255, 99, 132, 0.2)',

        ],
 borderColor: [
 'rgb(60, 179, 113)',
 'rgb(255, 99, 132)',

        ],
 borderWidth: 1,
 hoverBorderWidth: 2,
 hoverBorderColor: [
 'rgb(60, 179, 113)',
 'rgb(255, 99, 132)'],
    }]
};

const options = {
  element: {
    arc: {
      weight: 0.5,
      borderWidth: 3,
      maintainAspectRatio: false
    },
  },
  cutout: 40,
}


export default function Home() {

  // This variable is the `0` number in form of a BigNumber
  const zero = BigNumber.from(0);
  /** General state variables */
  // loading is set to true when the transaction is mining and set to false when
  // the transaction has mined
  const [loading, setLoading] = useState(false);
  /** Wallet connection */
 // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  //Keep track of the address connected
  const [walletAddress, setWalletAddress] = useState("");
  //keep track of the balance of DEX token from the exchange contract
  const [dexBalance, setDexBalance] = useState(zero);
  //keep track of ETH balance
  const [ethBalance, setEtherBalance] = useState(zero);
  //keep track of the balance of ETH in the contract
  // NOT USED CURRENTLY
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
  //keep track of which page is the user (dashboard, swap, pool or dao)
  const [currentPage, setCurrentPage] = useState("Dashboard");
  /** Variables to keep track of liquidity to be added or removed */
  // addEther is the amount of Ether that the user wants to add to the liquidity
  const [addEther, setAddEther] = useState(zero);
  // addTokens keeps track of the amount of tokens that the user wants to add to the liquidity
  // in case when there is no initial liquidity and after liquidity gets added it keeps track of the
  // tokens that the user can add given a certain amount of ether
  const [addTokens, setAddTokens] = useState(zero);
  // removeEther is the amount of `Ether` that would be sent back to the user based on a certain number of `LP` tokens
  const [removeEther, setRemoveEther] = useState(zero);
  // removeCD is the amount of  tokens that would be sent back to the user based on a certain number of `LP` tokens
  // that he wants to withdraw
  const [removeCD, setRemoveCD] = useState(zero);
  // amount of LP tokens that the user wants to remove from liquidity
  const [removeLPTokens, setRemoveLPTokens] = useState("0");
  //keep track of the balance of token choose in the swap tap
  const [inputBalance, setInputBalance] = useState(zero);
  //keep track of the balance of token choose in the swap tap
  const [outputBalance, setOutputBalance] = useState(zero);
  /** Variables to keep track of swap functionality */
  // Amount that the user wants to swap
  const [swapAmount, setSwapAmount] = useState("");
  // This keeps track of the number of tokens that the user would receive after a swap completes
  const [tokenToBeReceivedAfterSwap, settokenToBeReceivedAfterSwap] = useState(zero);
  // Keeps track of whether  `Eth` or a token is selected. If `Eth` is selected it means that the user
  // wants to swap some `Eth` for some tokens and vice versa if `Eth` is not selected
  const [ethSelected, setEthSelected] = useState(true);
  //keep track of the list of proposals created
  const [listProposals, setListProposals] = useState([]);
  //number of proposal created in DAO
  const [nbProposal, setNbProposal] = useState([0]);
  //keep tack of the proposal for which user has voted
  const [listHasVoted, setListHasVoted] = useState([]);
  //keep track if the user has click to "view details" in the DAO tab
  const [propDetails, setPropDetails] = useState(false);
  //keep track in which proposal the user want to show details
  const [currentPropDetails, setCurrentPropDetails] = useState(0);
  // We have two tabs in this dapp, Create Tab and Views Tab. This variable
  // keeps track of which Tab the user is on. If it is set to true this means
  // that the user is on `Create` tab else he is on `Views` tab
  const [selectedDAOTab, setSelectedDAOTab] = useState("view");
  //keep track of the list of pools created
  const [listPools, setListPools] = useState([]);
  //keep track of the list of pools with liquidity
  const [listPoolsWithLP, setListPoolsWithLP] = useState([]);
  //keep track in which pool user set the number of LP token he will remove
  const [currentPoolCalcul, setCurrentPoolCalcul] = useState();
  //number of pool created in DAO
  const [nbPool, setNbPool] = useState([0]);
  //keep track of the user balance for the differents tokens
  const [listBalanceOfTokens, setListBalanceOfTokens] = useState([]);
  //keep track of the LP token in the differents pools
  const [listLPToken, setListLPToken] = useState([]);
  //keep track of the token select in the list in swap tab
  const [selectedSwapToken, setSelectedSwapToken] = useState();

  const [hideZeroBalance, setHideZeroBalance] = useState(false);

  /**
    * getAmounts call various functions to retrive amounts for ethbalance,
    * LP tokens etc
    */
  const getAmounts = async () => {
      try {
        const provider = await getProviderOrSigner(false);
        const signer = await getProviderOrSigner(true);
        const address = await signer.getAddress();

        // get the amount of DEX token in the user's account
        const _dexBalance = await getDexTokenBalance(provider, address);
        // get the amount of eth in the user's account
        const _ethBalance = await getEtherBalance(provider, address);
        // Get the ether reserves in the contract
        const _ethBalanceContract = await getEtherBalance(provider, null, true);

        setDexBalance(_dexBalance);
        setEtherBalance(_ethBalance);
        setEtherBalanceContract(_ethBalanceContract);
        setInputBalance(_ethBalance);
      } catch (err) {
        console.error(err);
      }
    };


    /**** OTHER FUNCTIONS****/


    /**
      * displayListToken display the different token that exist in the contract
      */
    const displayListToken = () => {
      return (
      // return the symbol of the token in the select list
      listPoolsWithLP.map((pool, index) => (
        <option key="index" value={pool.tokenAddress}>{pool.symbol}</option>)
      ))
    }

    /**
      * logoToken display the logo of the token selected in the list in the swap tab
      */
    const logoToken = () => {
      return (
        // return the logo of the token selected in the select list
        <span className={styles.logo_token}>
        {listPoolsWithLP.map((pool, key) =>
        pool.tokenAddress == selectedSwapToken ?
          (<Image src={"/"+pool.symbol +".png"} height='32' width='32' alt="lux"/>)
        :
           (null)
        )}
        </span>
      )}


    /**** POOL FUNCTIONS ****/

    /**
      * _getNbPool get the number of pool that exist and save it to nbPool
      */
  const _getNbPool = async  () => {
    try {
      const provider = await getProviderOrSigner()
      // call the getNbPool function from the utils/pool.js folder
      const _nbPool = await getNbPool(provider);
      setNbPool(_nbPool)
      _fetchAllPools(nbPool.toString())
    } catch (err) {
      console.error(err);
    }
  }

  /**
    * _fetchAllPools get different data from the contract and save it to
    * different constant like the list of pool,
    * the list of user balance for the diferents tokens, the list pools with
    * liquidity and the list of LP tokens in each pool and save the
    */
  const _fetchAllPools = async () => {
    try{
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      // call the fetchAllPools function from the utils/pool.js folder
      const [_listPools, _listBalanceOfTokens, _listLPToken, _listPoolsWithLP]  = await fetchAllPools(provider, address)
      setListPools(_listPools)
      setListBalanceOfTokens(_listBalanceOfTokens)
      setListLPToken(_listLPToken)
      setListPoolsWithLP(_listPoolsWithLP)
      // if there is one pool created, we set some constants
      if(_listPoolsWithLP.length !=0) {
        // set the address from the 1st token in the list
        setSelectedSwapToken(_listPools[0].tokenAddress)
        // set the output balance from the 1st token in the list
        // the [0] is define to 0 because we start with 1 like the pool id
        setOutputBalance(_listBalanceOfTokens[1])
      }
    } catch (err) {
      console.error(err);
    }
  }

  /**
     * _addLiquidity helps add liquidity to the exchange,
     * If the user is adding initial liquidity, user decides the ether and tokens he wants to add
     * to the exchange. If he is adding the liquidity after the initial liquidity has already been added
     * then we calculate the crypto dev tokens he can add, given the Eth he wants to add by keeping the ratios
     * constant
     */
  const _addLiquidity = async (poolId, tokenAddress) => {
     try {
       // Convert the ether amount entered by the user to Bignumber
       const addEtherWei = utils.parseEther(addEther.toString());
       // Check if the values are zero
       if (!addTokens==0 && !addEtherWei==0) {
         const signer = await getProviderOrSigner(true);
         setLoading(true);
         // call the addLiquidity function from the utils folder
         await addLiquidity(signer, addTokens, addEtherWei, poolId.toString(), tokenAddress);
         setLoading(false);
         // Reinitialize the tokens
         setAddTokens(zero);
         // Get amounts for all values after the liquidity has been added
         await getAmounts();
       } else {
         setAddTokens(zero);
       }
     } catch (err) {
       console.error(err);
       setLoading(false);
       setAddTokens(zero);
     }
   };


   /**
    * _removeLiquidity: Removes the `removeLPTokensWei` amount of LP tokens from
    * liquidity and also the calculated amount of `ether` and `CD` tokens
    */
    const _removeLiquidity = async (poolId, tokenAddress) => {
      try {
        const signer = await getProviderOrSigner(true);
        // Convert the LP tokens entered by the user to a BigNumber
        const removeLPTokensWei = utils.parseEther(removeLPTokens);
        setLoading(true);
        // Call the removeLiquidity function from the `utils` folder
        await removeLiquidity(signer, removeLPTokensWei, poolId, tokenAddress);
        setLoading(false);
        await getAmounts();
        setRemoveCD(zero);
        setRemoveEther(zero);
      } catch (err) {
        console.error(err);
        setLoading(false);
        setRemoveCD(zero);
        setRemoveEther(zero);
      }
    };

    /**
      * _getTokensAfterRemove: Calculates the amount of `Ether` and tokens
      * that would be returned back to user after he removes `removeLPTokenWei` amount
      * of LP tokens from the contract
      */
    const _getTokensAfterRemove = async (_removeLPTokens, _tokenAddress, _ethReservedBalance, _tokenReservedBalance, _lpBalance) => {
      try {
        const provider = await getProviderOrSigner();
        // Convert the LP tokens entered by the user to a BigNumber
        const removeLPTokenWei = utils.parseEther(_removeLPTokens);
        // Get the Eth reserves within the exchange contract
        const _ethBalance = _ethReservedBalance;
        // get the crypto dev token reserves from the contract
        const tokenReserve = _tokenReservedBalance;
        // call the getTokensAfterRemove from the utils folder
        const { _removeEther, _removeCD } = await getTokensAfterRemove(
          provider,
          removeLPTokenWei,
          _ethBalance,
          tokenReserve,
          _lpBalance,
        );
        setRemoveEther(_removeEther);
        setRemoveCD(_removeCD);
      } catch (err) {
        console.error(err);
      }
    };

    /**** END ****/


    /**** SWAP FUNCTIONS ****/

    /**
     * swapTokens: Swaps  `swapAmountWei` of Eth/Crypto Dev tokens with `tokenToBeReceivedAfterSwap` amount of Eth/Crypto Dev tokens.
     */
    const _swapTokens = async () => {
       try {
         const tokenAddress=selectedSwapToken;
         // Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
         const swapAmountWei = utils.parseEther(swapAmount);
         // Check if the user entered zero
         // We are here using the `eq` method from BigNumber class in `ethers.js`
         if (!swapAmountWei.eq(zero)) {
           const signer = await getProviderOrSigner(true);

           setLoading(true);
           // Call the swapTokens function from the `utils` folder
           await swapTokens(
             signer,
             swapAmountWei,
             tokenToBeReceivedAfterSwap,
             ethSelected,
             tokenAddress
           );
           setLoading(false);
           // Get all the updated amounts after the swap
           await getAmounts();
           setSwapAmount("");
           await _getAmountOfTokensReceivedFromSwap(0);
         }
       } catch (err) {
         console.error(err);
         setLoading(false);
         setSwapAmount("");
       }
     };

   /**
    * _getAmountOfTokensReceivedFromSwap:  Returns the number of Eth/Crypto Dev tokens that can be received
    * when the user swaps `_swapAmountWEI` amount of Eth/Crypto Dev tokens.
    */
    const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
      try {
        // Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
        const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
        // Check if the user entered zero
        // We are here using the `eq` method from BigNumber class in `ethers.js`
        if (!_swapAmountWEI.eq(zero)) {
          const provider = await getProviderOrSigner();
          // Get the amount of ether in the contract
          const _ethReservedBalance = getEthinPool(listPools, selectedSwapToken)
          const _tokenReservedBalance = getTokeninPool(listPools, selectedSwapToken)
          // Call the `getAmountOfTokensReceivedFromSwap` from the utils folder
          const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
            _swapAmountWEI,
            provider,
            ethSelected,
            _ethReservedBalance,
            _tokenReservedBalance
          );
          settokenToBeReceivedAfterSwap(amountOfTokens);
        } else {
          settokenToBeReceivedAfterSwap(zero);
        }
      } catch (err) {
        console.error(err);
      }
    };

    /**
     * swapBalance: inverse balance after click on the arrow
     */
    const swapBalance = async () => {
      const provider = await getProviderOrSigner(false);
      const balance = await getTokensBalance(provider, walletAddress, listPools[0].tokenAddress);

       if(!ethSelected){
         setInputBalance(ethBalance);
         setOutputBalance(balance)
       }
       else{
         setOutputBalance(ethBalance);
         setInputBalance(balance)
       }
       setSelectedSwapToken(listPools[0].tokenAddress)
   }

   /**
    * updateBalance: update balance after the token in the select list change
    */
   const updateBalance = async (tokenAddress) => {
     const provider = await getProviderOrSigner(false);
     const balance = await getTokensBalance(provider, walletAddress, tokenAddress);
     setSelectedSwapToken(tokenAddress);
     if(ethSelected){
       setOutputBalance(balance);
     }
     else{
       setInputBalance(balance);
     }
   }

    /*** END ***/

   /*  DAO Function   */


   /**
    * _createProposal: call createProposal function from the utils/dao.js folder
    */
   const _createProposal = async () => {
     try {
       const provider = await getProviderOrSigner()
       const signer = await getProviderOrSigner(true)

       // get the values from the differents fields
       var proptitle = document.getElementById("propTitle").value
       var propDesc = document.getElementById("propDesc").value
       var propTokenAddress = document.getElementById("propTokenAddress").value
       var propDeadline = document.getElementById("propDeadline").value

       const isERC20 = await getTokensBalance(provider, walletAddress, propTokenAddress, )
       console.log("is erc20 ", isERC20)
       if (isERC20 != undefined) {
         setLoading(true);
         await createProposal(signer, proptitle, propDesc, propDeadline, propTokenAddress )
         // call _getNbProposal in order to update the nb of proposal
         await _getNbProposal()
         // call _fetchAllPools in order to update the differents list
         await _fetchAllPools()
         setLoading(false);
      }
      else {
        window.alert("Token address is not an ERC20 token");
        throw new Error("Not an ERC20 address");
      }
     } catch (err) {
       console.error(err);
     }
   }

   /**
    * _voteForProposal: call voteForProposal function from the utils/dao.js folder
    */
   const  _voteForProposal = async (_proposalId, _vote) => {
     try {
       const signer = await getProviderOrSigner(true)
       setLoading(true);
       await voteForProposal(signer, _proposalId, _vote)
       // call _fetchAllProposals in order to update the list of proposal
       await _fetchAllProposals()
       setLoading(false);

     } catch (err) {
       console.error(err);
     }
   }

   /**
    * _fetchAllProposals: call fetchAllProposals function from the utils/dao.js folder
    */
   const _fetchAllProposals = async () => {
     try{
       const provider = await getProviderOrSigner()
       const [_listProposals, _listHasVoted] = await fetchAllProposals(provider, walletAddress, nbProposal)
       setListProposals(_listProposals)
       setListHasVoted(_listHasVoted)
     } catch (err) {
       console.error(err);
     }
   }

   /**
    * _getNbProposal: call getNbProposal function from the utils/dao.js folder
    */
   const _getNbProposal = async () => {
     try {
       const provider = await getProviderOrSigner()
       const _nbProposal = await getNbProposal(provider);
       setNbProposal(_nbProposal)
     } catch (err) {
       console.error(err);
     }
   }

   /**
    * _executeProposal: call executeProposal function from the utils/dao.js folder
    */
   const _executeProposal = async (_proposalId) => {
     try {
     const signer = await getProviderOrSigner(true);
     setLoading(true);
     await executeProposal(signer, _proposalId)
     // call _getNbPool in order to update the list of pool
     await _getNbPool();
     // call _fetchAllPools in order to update the list of pools
     await _fetchAllPools();
     setLoading(false);

   } catch (err) {
     console.error(err);
   }
  };

  /*** END ***/

 /**
   * connectWallet: Connects the MetaMask wallet
   */
   const connectWallet = async () => {
      try {
        // Get the provider from web3Modal, which in our case is MetaMask
        // When used for the first time, it prompts the user to connect their wallet
        await getProviderOrSigner(true);
        setWalletConnected(true);
      } catch (err) {
        console.error(err);
      }
    };

    // Helper function to fetch a Provider/Signer instance from Metamask
    const getProviderOrSigner = async (needSigner = false) => {
      // Connect to Metamask
      // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);

      // If user is not connected to the Rinkeby network, let them know and throw an error
      const { chainId } = await web3Provider.getNetwork();

      if (chainId !== 4) {
        window.alert("Change the network to Rinkeby");
        throw new Error("Change network to Rinkeby");
      }

      if (needSigner) {
        const signer = web3Provider.getSigner();
        const signerAddress = await signer.getAddress();
        setWalletAddress(signerAddress)
        return signer;
      }
      return web3Provider;
    };

    // render the connect button
    const renderButtonConnect = () => {
      if(!walletConnected){
        return (<button
                    className={styles.connect}
                    type="button"
                    onClick={connectWallet}
                  >
                    Connect Wallet
                  </button>
                );
      }
      else {
        return (  <span className={styles.walletAddress}>{walletAddress}</span>
        );
      }
    };


    /**
      * render pool tab
      */
    const renderPool = () => {
      if(loading){
        return (
          <div className={styles.loading}>
            Loading... Waiting for transaction...
          </div>
        );
      }
      else if (parseInt(nbPool) ==0)
        return (
          <div className={styles.message}>
            There is no pool
          </div>
      );
      else {
        return (
          <center>
          <div>
          {listPools.map((pool,key)=> (

            <div key={key} className={styles.pool}>
                <div>
                <div className={styles.pool_title}>
                  <div className={styles.pool_logo}>
                    <Image src="/ETH.png" height='32' width='32' alt="eth"/>
                    <Image src={"/"+pool.symbol+".png"} height='32' width='32' alt="eth"/>
                  </div>
                  <label className={styles.lbl_pool_title}>Pool {pool.symbol}/ETH </label>
                </div>
                  <p className={styles.balance}>ETH : {utils.formatEther(ethBalance).substring(0,10)}</p>
                  <p className={styles.balance}>{pool.name} Token : {utils.formatEther((listBalanceOfTokens[pool.id])).substring(0,10)} </p>
                  <p className={styles.balance}>Pool reserve {utils.formatEther(pool.tokenReservedBalance).substring(0,10)} {pool.symbol}/{utils.formatEther(pool.ethReservedBalance)} ETH :</p>
                </div>
                  {/* if there is no liquidity, we display two input text, one for the number of ETH and
                  the other for the number of token we want to add in the pool in order to initialise the ratio*/}
                  {pool.lpBalance==0 ? (
                    <div >
                      <input
                        type="number"
                        placeholder="Amount of Ether"
                        onChange={(e) => setAddEther(e.target.value || "0")}
                        className=""
                        required />
                        <br/>
                        <input
                          type="number"
                          placeholder="Amount of tokens"
                          onChange={(e) => setAddTokens(BigNumber.from(utils.parseEther(e.target.value || "0")))}
                          className=""
                          required />
                          <br/>
                          <button
                          type="button"
                          onClick={() =>{_addLiquidity(pool.id, pool.tokenAddress)} }
                            className={styles.btn_add}>
                              Add</button>
                      </div>
                  )
               : (
                 // else we display one input for the number of ETH you will add and the number of token
                 // will be calculate automatically
                 <div>
                 <input
                   type="number"
                   placeholder="Amount of Ether"
                   onChange={async (e) => {setAddEther(e.target.value || "0");
                        const _addCDTokens = await calculateToken(
                         e.target.value || "0",
                         pool.ethReservedBalance,
                         pool.tokenReservedBalance
                       );
                       setAddTokens(_addCDTokens);
                       setCurrentPoolCalcul(pool.id)}}
                   className=""
                   required />
                   <br/>
                   <input
                     type="number"
                     placeholder="Amount of Token"
                     className=""
                     value={ currentPoolCalcul == pool.id.toString() ? utils.formatEther(addTokens).substring(1,10) : "0"}
                     disabled />
                     <br/>
                   <button
                   type="button"
                   onClick={() =>{_addLiquidity(pool.id, pool.tokenAddress)} }
                     className={styles.btn_add}>
                       Add</button>
                       <br/>
                  <div className={styles.remove_liquidity}>
                  <p className={styles.balance}>LP Token : {utils.formatEther(listLPToken[pool.id])} </p>
                 <input
                   type="number"
                   placeholder="Amount of LP"
                   onChange={async (e) => {
                    setRemoveLPTokens(e.target.value || "0");
                    await _getTokensAfterRemove(e.target.value, pool.tokenAddress, pool.ethReservedBalance, pool.tokenReservedBalance, pool.lpBalance || "0");
                    // we keep track on wich pool we want to remove liquidity
                    setCurrentPoolCalcul(pool.id)
                  }}
                   className=""
                   required />
                    <br/>
                   <button
                     type="button"
                     className={styles.btn_remove}
                     onClick={() =>{_removeLiquidity(pool.id, pool.tokenAddress)}}>
                       Remove
                     </button>
                     {/* we update the sentence only for the pool we are*/}
                     {currentPoolCalcul == pool.id.toString() ? (
                     <p className={styles.lbl_get_remove}> You will get {utils.formatEther(removeCD).substring(0,10)} {pool.name} Tokens and {utils.formatEther(removeEther)} Eth</p>)
                     : (<p className={styles.lbl_get_remove}> You will get 0 {pool.name} and 0 Eth</p>)
                    }
                 </div>
                 </div>

                  )}
                  </div>
              ))}
              </div>
              </center>

      )}
  };

  /**
    * render swap tab
    */
    const renderSwap = () => {
      if(loading){
        return (
          <div className={styles.loading}>
            Loading... Waiting for transaction...
          </div>
        );
      }
      else if (parseInt(nbPool) ==0){
        return (
          <div className={styles.message}>
            There is no pair
          </div>
        );
      }
      else  {
      return (
        <div>
            <div className={styles.swap}>
              <div className={styles.input}>
              <span className={styles.lbl_from}>FROM</span>
                <div className={styles.input_balance}>
                    <div className="from_balance"><b> Balance : {utils.formatEther(inputBalance).substring(0,10)}</b>
                    <input
                    onClick={async (e) => {setSwapAmount(utils.formatEther(inputBalance));
                      await _getAmountOfTokensReceivedFromSwap(utils.formatEther(inputBalance) || "0");}}
                     className={styles.btn_max} type="button" id="max" value="max" />
                    <input
                    onClick={async (e) => {setSwapAmount(utils.formatEther(inputBalance)/2);
                      await _getAmountOfTokensReceivedFromSwap((utils.formatEther(inputBalance)/2) || "0");}}
                    className={styles.btn_half} type="button" id="half" value="half" />
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    onChange={async (e) => {
              setSwapAmount(e.target.value || "");
              // Calculate the amount of tokens user would receive after the swap
              selectedSwapToken!=undefined ? await _getAmountOfTokensReceivedFromSwap(e.target.value || "0") : 0;
            }}
                    value={swapAmount}
                    className={styles.input_field}
                    placeholder='0'
                    required />
              {/* if ETH is not selected for the input, so we display the select list*/}
              {!ethSelected ? (<span>  {logoToken()}
              <select className={styles.selectList}name="inputList" id="inputTokenList" onChange={ (e)=> updateBalance(e.target.value)}>
                {displayListToken()}
              </select> </span> )
              : (<span className={styles.logo_eth}><Image src="/ETH.png" height='32' width='32' alt="eth"/><span className= {styles.lbl_eth}> ETH</span></span>)}
                </div>
                </div>

                <div className={styles.fleche_swap}>
                <center>
                <input
                onClick= {async (e) => {
                    setEthSelected(!ethSelected);
                    setSwapAmount(0);
                    await _getAmountOfTokensReceivedFromSwap(0);
                    swapBalance();
                  }}
                 type="image" id="image" alt="switch" width='50'
                       src="./fleche_swap.png" />
                </center>
              </div>

                <div className={styles.output}>
                <span className={styles.lbl_to}>TO</span>

                <div className={styles.output_balance}>
                    <div className="to_balance"> <b> Balance : {utils.formatEther(outputBalance).substring(0,10)}</b> </div>
                </div>
                <div >
                  <div>
                  <input
                    type="text"
                    className={styles.output_field}
                    placeholder="0"
                    value={utils.formatEther(tokenToBeReceivedAfterSwap)}
                    disabled
                  />
                  {/* if ETH is not selected for the input, so we display the select list*/}
                  {ethSelected ?  (<span>  {logoToken()}
                  <select className= {styles.selectList} name="outputList" id="outputTokenList" onChange={ (e)=> updateBalance(e.target.value)}>
                      {displayListToken()}
                  </select></span> )

                  : (<span className={styles.logo_eth}><Image  src="/ETH.png" height='32' width='32' alt="eth"/><span className={styles.lbl_eth}> ETH</span></span>)}
                </div>
                </div>

                </div>

                  <center><button onClick= {_swapTokens}
                   className={styles.btn_swap}>SWAP!</button></center>
            </div>
        </div>
      );
    }
    };

    /**
  * render created tab in the DAO tab
  */
    const renderCreateProposalTab = () => {
      if(loading){
        return (
          <div className={styles.loading}>
            Loading... Waiting for transaction...
          </div>
        );
      }
      // if you haven't 10000 DEX token a message appear
      else if(utils.formatEther(dexBalance) < 10000)
      {
        return (
        <div className={styles.description}>
          You do not own 10000 DEX token. <br />
          <b>You cannot create a proposal</b><br />
          Staken token in order to get DEX token
        </div>
      );
      }
      // we return the creation form
      else
      {
        return (
        <div className={styles.create_main}>
        <div className={styles.create_prop_title}>Create Proposal</div>
          <p className={styles.create_prop_field}>Title :</p>

            <input
                type="text"
                id="propTitle"
                className={styles.create_prop_input}
                placeholder="Title"
                required />
          <p className={styles.create_prop_field}>Description :</p>
            <textarea
                type="text"
                id="propDesc"
                rows="5"
                cols="40"
                className={styles.create_prop_textarea}
                placeholder="Description"
                required ></textarea>
          <p className={styles.create_prop_field}>Token Address : </p>
            <input
                type="text"
                id="propTokenAddress"
                className={styles.create_prop_input}
                placeholder="ERC-20 address"
                required />
            <p className={styles.create_prop_field}>End date : </p>
              <input
                  type="text"
                  id="propDeadline"
                  className={styles.create_prop_input}
                  placeholder="Timestamp"
                  required />
            <p>
            <center><button type="button" onClick = {(e) => _createProposal()} className={styles.btn_create}>Create</button></center>
            </p>
        </div>
        );
      }
    }

    /**
      * render view tab in the DAO tab
      */
    const renderViewProposalsTab = () => {
      if(loading){
        return (
          <div className={styles.loading}>
            Loading... Waiting for transaction...
          </div>
        );
      }
      // if there is no proposal
      else if(parseInt(nbProposal) ==0){
        return (
          <div className={styles.message}>
            There is no proposal
          </div>
        );
      }
      else  {
          return (
        <div>
        {listProposals.reverse().map(function(proposal, key) {
          let status, endDate, button, detailsView
          if((proposal.deadline.toString() >  Math.round(new Date()/1000)) && !listHasVoted[proposal.id.toString()] )
          {
            status = "In Progress"
            endDate = timeConverter(proposal.deadline.toString())
            button = <div className={styles.div_btn}><input onClick={(event) => {_voteForProposal(proposal.id, "No")}}
                              className={styles.btn_no} type="button" value="No" />
                           <input onClick={(event) => {_voteForProposal(proposal.id, "Yes")}}
                              className={styles.btn_yes} type="button" value="Yes" /></div>
          }
          else if((proposal.deadline.toString() >  Math.round(new Date()/1000)) && listHasVoted[proposal.id.toString()])
          {
            status = "In Progress"
            endDate = timeConverter(proposal.deadline.toString())
            button = <div className={styles.div_btn}><input onClick={(event) => {}}
                              className={styles.btn_already_voted} type="button" id="half" value="Already Vote" disabled /></div>
          }
          else if(proposal.yes.toString()> proposal.no.toString() && (proposal.deadline.toString() <  Math.round(new Date()/1000)) && !proposal.isExecuted )
          {
            status = <span className={styles.div_btn}>Passed</span>
            endDate = "Finished"
            button = <div className={styles.btn_execute}><input className="" type="button" value="Execute" onClick = { () => _executeProposal(proposal.id.toString())} /></div>
          }
          else if (proposal.isExecuted){
            status = "Executed"
            endDate = "Finished"
            button = <div className={styles.div_btn}><input onClick={(event) => {}}
                              className={styles.btn_voting_end} type="button" value="Executed" disabled /></div>
          }
          else {
            status = "Rejected"
            endDate = "Finished"
            button = <div className={styles.div_btn}><input onClick={(event) => {}}
                              className={styles.btn_voting_end} type="button" value="Rejected" disabled /></div>
          }

          // display the detail of the prop
          if(propDetails==true && currentPropDetails === proposal.id.toString()){
            detailsView = <div className={styles.details}>
              <p className={styles.createby}>Voting Starts : {timeConverter(proposal.createcAt)}</p>
              <p className={styles.createby}>Voting Ends : {timeConverter(proposal.deadline)}</p>
              <p className={styles.yes}>Yes : {utils.formatEther(proposal.yes)}</p>
              <p className={styles.no}>No : {utils.formatEther(proposal.no)}</p>
              <div className={styles.dougnut}>
              <Doughnut data={data} options={options} width={100} height={100}/>
              </div>
              <p className={styles.prop_desc2}> Description : {proposal.description.toString()}</p>


              {button}
              </div>
          }

          return(
          <div key={key} className={styles.prop}>
            <div className={styles.prop_id}> Proposal # {proposal.id.toString()}</div>
            <p className={styles.prop_title}> Title : <b>{proposal.titre}</b></p>
            <span className={styles.prop_status}> Status : <b>{status}</b></span>
            <br/>
            <span className={styles.enddate}> End time : {endDate}</span>
            {propDetails && currentPropDetails == proposal.id.toString()?  (
              <center><button className={styles.prop_detail} onClick= {(e)=>{ setPropDetails(false) ; setCurrentPropDetails(proposal.id.toString())}}>Hide details</button><br/></center>
            ) :  (
              <center><button className={styles.prop_detail} onClick= {(e)=>{ setPropDetails(true); setCurrentPropDetails(proposal.id.toString())}}>View details</button><br/></center>
            )}
             {detailsView}
          </div>
            )
          })}
          </div>
        );
      }
    }

    /**
    * render the two button "create" and "view" tab in the DAO tab
    */
    const renderTab = () => {
      if (selectedDAOTab === "create") {
          return renderCreateProposalTab();
        }
      else if (selectedDAOTab === "view") {
          return (
            <div className={styles.p_form}>
              {renderViewProposalsTab()}
            </div>
          )
        }
        return null;
      }


      /**
      * render the tab "create" or "view" tab in order of which button the user has clicked
      */
      const renderDAO = () => {
        return (
          <div>
            <div className={styles.tab_choise}>
                <button
                  className={styles.btn_create_prop}
                  onClick={() => setSelectedDAOTab("create")}
                >
                  Create Proposal
                </button>
                <button
                  className={styles.btn_view_prop}
                  onClick={() => setSelectedDAOTab("view")}
                >
                  View Proposals
                </button>
              </div>
              {renderTab()}
            </div>
          )
      }

      /**
      * render the dashboard
      */

      const renderDashBoard_v2 = () => {
        if(listBalanceOfTokens !=0 )
        {
        return (
          <div className={styles.recap}>
            <div className={styles.portfolio}>
              <p className={styles.title}>Portfolio</p>
              <input type="checkbox" onChange = { async (e)=> {setHideZeroBalance(!hideZeroBalance); await _fetchAllPools()}}/> Hide zero balance
              <p className={styles.balance_dash}><Image src="/ETH.png" height='32' width='32' alt="eth"/> ETH : {utils.formatEther(ethBalance).substring(0,10)}</p>
              {
                listBalanceOfTokens.map((token, index) => (
                  (!hideZeroBalance || token != 0) && index !=0 ? (
                    <p key={index} className={styles.balance_dash}><Image src={"/" + listPools[index-1].symbol + ".png"} height='32' width='32' alt="eth"/> {listPools[index-1].symbol} : {utils.formatEther(token).substring(0,10)}</p>
                  )
                  :
                  (null)
              )
            )}
            </div>
           </div>
        )
      }
      else {
        return (
          <div className={styles.recap}>
            <div className={styles.portfolio}>
              <p className={styles.title}>Portfolio</p>
              <p className={styles.balance_dash}><Image src="/ETH.png" height='32' width='32' alt="eth"/> ETH : {utils.formatEther(ethBalance).substring(0,10)}</p>
            </div>
          </div>
        )
      }
    }


    /*
     *renderPage: Returns a button based on the state of the dapp
     */
    const renderPage =  () => {
      if(currentPage=="Dashboard"){
        return (
          renderDashBoard_v2());
      }
      else if(currentPage=="Pool"){
        return (renderPool());
      }
      else if(currentPage=="Swap"){
        return (renderSwap());
      }
      else if(currentPage=="Gouvernance"){
        return (renderDAO());
      }
    }


  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      _getNbProposal();
      _getNbPool();
      _fetchAllPools();
      getAmounts();
    }

  }, [walletConnected]);

  // set an interval to get the number of token Ids minted every 5 seconds

  // Piece of code that runs everytime the value of `currentPage` changes
  // Used to re-fetch all proposals in the DAO when user switches
  // to the 'DAO' tab
  useEffect(() => {
    if (currentPage==="Gouvernance") {
      _fetchAllProposals();
    }
  }, [currentPage]);

  // Used to re-fetch all proposals in the DAO when user switches
  // to the 'Pool' tab
  useEffect(() => {
    if (currentPage!="Dashboard") {
      _getNbPool();
      _fetchAllPools();
    }
  }, [currentPage]);


  return (
    <div>
      <Head>
        <title>Dexter</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
  <div className={styles.main}>
    <div className={styles.navbar}>
        <button className={styles.btn_navbar}onClick={(event) => {setCurrentPage("Dashboard")}}>Dashboard</button>
        <button className={styles.btn_navbar} onClick={(event) => {setCurrentPage("Swap")}}>Swap</button>
        <button className={styles.btn_navbar} onClick={(event) => {setCurrentPage("Pool")}}>Pool</button>
        <button className={styles.btn_navbar} onClick={(event) => {setCurrentPage("Gouvernance")}}>DAO</button>
        {renderButtonConnect()}
    </div>
    <div className={styles.page}>
     {renderPage()}
  </div>
  </div>
  <footer className={styles.footer}>
    Made with &#10084; by Crypto Rom1
    <button className={styles.btn_telegram_footer} type="button" onClick={ (e) => window.location.href="https://t.me/romain_invest"}><Image src="/telegram.png" height='50' width='50' alt="telegram"/></button>
    <button className={styles.btn_twitter_footer} type="button" onClick={ (e) => window.location.href="https://twitter.com/CryptoRomain"}><Image src="/twitter.png" height='50' width='50' alt="github"/></button>
    <button className={styles.btn_linkedn_footer} type="button" onClick={ (e) => window.location.href="https://www.linkedin.com/in/romain-noeppel-9a2132162/"}><Image src="/linkedn.png" height='50' width='50' alt="linkedn"/></button>
    <button className={styles.btn_footer} type="button" onClick={ (e) => window.location.href="https://github.com/Rom1Code/DEXter_v2"}><Image src="/github.png" height='50' width='50' alt="github"/></button>
    <p>Thanks to <a href="https://learnweb3.io/"> LearnWeb3.io</a></p>
  </footer>
</div>

);
}
