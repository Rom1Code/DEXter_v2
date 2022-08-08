import { BigNumber, providers, utils, Contract } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import flecheSwap from "./fleche_swap.png";
import {
  ROMAIN_TOKEN_ADDRESS,
  LUCILE_TOKEN_ADDRESS,
  TOKEN_CONTRACT_ABI,

} from "../constants";
import {
  addLiquidity,
  removeLiquidity,
  calculateToken,
  getTokensAfterRemove,
  getNbPool,
  fetchAllPools,
  getTokensBalanceV2,
  } from "../utils/pool";
import {
  getTokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getReserveOfTokens,
  getDexTokenBalance,
  getEthinPool,
  getTokeninPool,
} from "../utils/getAmounts";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";
import { createProposal, voteForProposal, fetchAllProposals, getNbProposal, executeProposal } from "../utils/dao";
import { progressBar, timeConverter } from "../utils/helper";


import Dashboard from './Dashboard'

export default function Home() {

  const zero = BigNumber.from(0);

  const [loading, setLoading] = useState(false);
  const web3ModalRef = useRef();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [dexBalance, setDexBalance] = useState(zero);
  const [ethBalance, setEtherBalance] = useState(zero);
  const [lucileBalance, setLucileBalance] = useState(zero);
  const [romainBalance, setRomainBalance] = useState(zero);
  const [lpBalance, setLPBalance] = useState(zero);
  const [reservedLucile, setReservedLucile] = useState(zero);
  const [reservedRomain, setReservedRomain] = useState(zero);
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [addEther, setAddEther] = useState(zero);
  const [addTokens, setAddTokens] = useState(zero);
  const [removeEther, setRemoveEther] = useState(zero);
  const [removeCD, setRemoveCD] = useState(zero);
  const [removeLPTokens, setRemoveLPTokens] = useState("0");
  const [inputBalance, setInputBalance] = useState(zero);
  const [outputBalance, setOutputBalance] = useState(zero);
  const [swapAmount, setSwapAmount] = useState("");
  const [tokenToBeReceivedAfterSwap, settokenToBeReceivedAfterSwap] = useState(zero);
  const [ethSelected, setEthSelected] = useState(true);

  const [listProposals, setListProposals] = useState([]);
  const [nbProposal, setNbProposal] = useState([0]);
  const [listHasVoted, setListHasVoted] = useState([]);
  const [propDetails, setPropDetails] = useState(false);
  const [currentPropDetails, setCurrentPropDetails] = useState(0);
  const [selectedDAOTab, setSelectedDAOTab] = useState("view");

  const [listPools, setListPools] = useState([]);
  const [nbPool, setNbPool] = useState([0]);

  const [listBalanceOfTokens, setListBalanceOfTokens] = useState([]);
  const [listLPToken, setListLPToken] = useState([]);

  const [selectedSwapToken, setSelectedSwapToken] = useState();
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
        // get the amount of `Crypto Dev` tokens held by the user
        const _lucileBalance = await getTokensBalance(provider, address, LUCILE_TOKEN_ADDRESS);
        // get the amount of `Crypto Dev` tokens held by the user
        const _romainBalance = await getTokensBalance(provider, address, ROMAIN_TOKEN_ADDRESS);
        // get the amount of `Crypto Dev` LP tokens held by the user
        const _lpBalance = await getLPTokensBalance(provider, address);
        // gets the amount of `CD` tokens that are present in the reserve of the `Exchange contract`
        const _reservedLucile = await getReserveOfTokens(provider, LUCILE_TOKEN_ADDRESS);
        const _reservedRomain = await getReserveOfTokens(provider, ROMAIN_TOKEN_ADDRESS);
        // Get the ether reserves in the contract
        const _ethBalanceContract = await getEtherBalance(provider, null, true);


        setDexBalance(_dexBalance);
        setEtherBalance(_ethBalance);
        setLucileBalance(_lucileBalance);
        setRomainBalance(_romainBalance);
        setLPBalance(_lpBalance);
        setReservedLucile(_reservedLucile);
        setReservedRomain(_reservedRomain);
        setEtherBalanceContract(_ethBalanceContract);
        setInputBalance(_ethBalance);

      } catch (err) {
        console.error(err);
      }
    };


      /**** POOL FUNCTIONS ****/
    const _getNbPool = async  () => {
      try {
        const provider = await getProviderOrSigner()
        const _nbPool = await getNbPool(provider);
        setNbPool(_nbPool)
        _fetchAllPools(nbPool.toString())
      } catch (err) {
        console.error(err);
      }
    }

    const _fetchAllPools = async () => {
      try{
        const provider = await getProviderOrSigner()
        const [_listPools, _listBalanceOfTokens, _listLPToken]  = await fetchAllPools(provider, nbPool, walletAddress)
        setListPools(_listPools)
        setListBalanceOfTokens(_listBalanceOfTokens)
        setListLPToken(_listLPToken)
        setOutputBalance(_listBalanceOfTokens[1])
        setSelectedSwapToken(_listPools[0].tokenAddress)
        console.log("_fetchAllPools",_listPools)
      } catch (err) {
        console.error(err);
      }
    }

    const displayListToken = () => {
      return (
      listPools.map((pool, key) => {
        return (
        <option value={pool.tokenAddress}>{pool.symbol}</option>)
    }
  ))
    }

    const _addLiquidity = async (poolId, tokenAddress) => {
      console.log("_add liquidity",tokenAddress)
      console.log("_add liquidity",poolId.toString())

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
           // Reinitialize the CD tokens
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

  const _getTokensAfterRemove = async (_removeLPTokens, _tokenAddress, _ethReservedBalance) => {
    console.log("poolid eth",_ethReservedBalance)
    try {
      const provider = await getProviderOrSigner();
      // Convert the LP tokens entered by the user to a BigNumber
      const removeLPTokenWei = utils.parseEther(_removeLPTokens);
      // Get the Eth reserves within the exchange contract
      const _ethBalance = _ethReservedBalance;
      // get the crypto dev token reserves from the contract
      const tokenReserve = await getReserveOfTokens(provider, _tokenAddress);
      // call the getTokensAfterRemove from the utils folder
      const { _removeEther, _removeCD } = await getTokensAfterRemove(
        provider,
        removeLPTokenWei,
        _ethBalance,
        tokenReserve
      );
      setRemoveEther(_removeEther);
      setRemoveCD(_removeCD);
    } catch (err) {
      console.error(err);
    }
  };





  /**** SWAP FUNCTIONS ****/


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
     }
   } catch (err) {
     console.error(err);
     setLoading(false);
     setSwapAmount("");
   }
 };

  const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
    console.log("selectedSwapToken",selectedSwapToken)
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

  const swapBalance = () => {
   if(!ethSelected){
     setInputBalance(ethBalance);
     setOutputBalance(lucileBalance);
   }
   else{
     setInputBalance(lucileBalance);
     setOutputBalance(ethBalance);
   }
 }

 /*  DAO Function   */

 const _createProposal = async () => {
   try {
     const signer = await getProviderOrSigner(true)
     var proptitle = document.getElementById("propTitle").value
     var propDesc = document.getElementById("propDesc").value
     var propTokenAddress = document.getElementById("propTokenAddress").value
     var propDeadline = document.getElementById("propDeadline").value

     setLoading(true);
     await createProposal(signer, proptitle, propDesc, propDeadline, propTokenAddress )
     await _getNbProposal()
     setLoading(false);
   } catch (err) {
     console.error(err);
   }
 }

 const  _voteForProposal = async (_proposalId, _vote) => {
   try {
     const signer = await getProviderOrSigner(true)
     setLoading(true);
     await voteForProposal(signer, _proposalId, _vote)
     await _fetchAllProposals()
     setLoading(false);

   } catch (err) {
     console.error(err);
   }
 }

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

 const _getNbProposal = async () => {
   try {
     const provider = await getProviderOrSigner()
     const _nbProposal = await getNbProposal(provider);
     setNbProposal(_nbProposal)
   } catch (err) {
     console.error(err);
   }
 }

 const _executeProposal = async (_proposalId) => {
   try {
   const signer = await getProviderOrSigner(true);
   await executeProposal(signer, _proposalId)
 } catch (err) {
   console.error(err);
 }
};



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


    /*
     renderPage: Returns a button based on the state of the dapp
 */

    const renderPool = () => {
      console.log(listBalanceOfTokens)
      if(loading){
        return (
          <div className={styles.description}>
            Loading... Waiting for transaction...
          </div>
        );
      }
      else if(parseInt(nbPool) !=0) {
        console.log("lp",listLPToken[0].toString())
        return (
          <center>
          <div>
          {listPools.map((pool,key)=> (

            <div className={styles.pool}>
                <div>
                  <p className={styles.rate_pool}>Pool {pool.symbol}/ETH token </p>
                  <p className={styles.balance}>ETH : {utils.formatEther(ethBalance)}</p>
                  <p className={styles.balance}>{pool.name} Token : {utils.formatEther((listBalanceOfTokens[pool.id]))} </p>
                    <p className={styles.balance}>LP Token : {utils.formatEther(listLPToken[pool.id])} </p>
                  <p className={styles.balance}>Pool reserve {utils.formatEther(pool.tokenReservedBalance)} {pool.symbol}/{utils.formatEther(pool.ethReservedBalance)} ETH :</p>

                </div>
                  {pool.tokenReservedBalance==0 ? (
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
                            className={styles.btn_stake}>
                              ADD</button>
                      </div>
                  )
               : (
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
                       setAddTokens(_addCDTokens);}}
                   className=""
                   required />
                   <br/>
                   <input
                     type="number"
                     placeholder="Amount of Token"
                     className=""
                     value={utils.formatEther(addTokens)}
                     disabled />
                     <br/>
                   <button
                   type="button"
                   onClick={() =>{_addLiquidity(pool.id, pool.tokenAddress)} }
                     className={styles.btn_stake}>
                       ADD</button>
                       <br/>
                 <p className={styles.balance}>Balance of LP Token : {utils.formatEther(lpBalance)}</p>
                 <input
                   type="number"
                   placeholder="Amount of LP"
                   onChange={async (e) => {
                    setRemoveLPTokens(e.target.value || "0");
                    await _getTokensAfterRemove(e.target.value, pool.tokenAddress, pool.ethReservedBalance || "0");
                  }}
                   className=""
                   required />
                   <p> You will get {utils.formatEther(removeCD)} {pool.name} Tokens and {utils.formatEther(removeEther)} Eth</p>
                   <button
                     type="button"
                     className={styles.btn_unstake}
                     onClick={() =>{_removeLiquidity(pool.id, pool.tokenAddress)}}>
                       REMOVE
                     </button>

                 </div>
                  )}
                  </div>
              ))}
              </div>
              </center>

      )}
      else {
        return (
          <div className={styles.description}>
            There is no pool
          </div>
      );
    }
  };


  const updateBalance = async (tokenAddress) => {
    console.log("updateBalance",tokenAddress)
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

    const renderSwap = () => {
      if(loading){
        return (
          <div className={styles.description}>
            Loading... Waiting for transaction...
          </div>
        );
      }
      else if(parseInt(nbPool) !=0) {
      return (
        <center>
        <div>
            <div className={styles.swap}>
                <div className="row text-white">
                    <div class="from_balance"><b> Balance : {utils.formatEther(inputBalance)}</b>
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
                <div className="input-group mb-4 overflow-hidden" style={{overflow: "hidden"}}>
                  <input
                    type="text"
                    onChange={async (e) => {
              setSwapAmount(e.target.value || "");
              // Calculate the amount of tokens user would receive after the swap
              await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
            }}
                    value={swapAmount}
                    className="form-control form-control-lg"
                    placeholder='0'
                    required />
              {!ethSelected ? (
              <select name="inputList" id="inputTokenList" onChange={ (e)=> updateBalance(e.target.value)}>
                  {displayListToken()}
              </select> )
              : (<span>ETH</span>)}
                </div>
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


                <div className="row text-white">
                    <div class="to_balance"> <b> Balance : {utils.formatEther(outputBalance)}</b> </div>
                </div>
                <div className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="0"
                    value={utils.formatEther(tokenToBeReceivedAfterSwap)}
                    disabled
                  />
                  {ethSelected ? (
                  <select name="outputList" id="outputTokenList" onChange={ (e)=> updateBalance(e.target.value)}>
                      {displayListToken()}
                  </select> )
                  : (<span>ETH</span>)}
                </div>
                <div className="mb-4 text-white ">
                  <center><p class="info_rate">Exchange Rate : 1 ETH = </p></center>
                </div>
                  <center><button onClick={_swapTokens} className={styles.btn_swap}>SWAP!</button></center>
            </div>
        </div>
        </center>
      );
    }
    else {
      return (
        <div className={styles.description}>
          There is no pair
        </div>
    );
    }
    };

    const renderCreateProposalTab = () => {
      if(loading){
        return (
          <div className={styles.description}>
            Loading... Waiting for transaction...
          </div>
        );
      }
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
      else
      {
        return (
        <center>
        <div className={styles.create_main}>
        <p className={styles.create_prop_title}>Create Proposal</p>
          <p className="">Title :
            <input
                type="text"
                id="propTitle"
                className= "ml-2 w-100"
                placeholder="Title"
                required />
          </p>
          <p className="">Description :
            <input
                type="text"
                id="propDesc"
                className= "ml-2 w-100"
                placeholder="Description"
                required />
          </p>
          <p className="">Token Address :
            <input
                type="text"
                id="propTokenAddress"
                className= "ml-2 w-100"
                placeholder="Description"
                required />
          </p>
            <p className="">End date :
              <input
                  type="text"
                  id="propDeadline"
                  className= "ml-2"
                  placeholder="Timestamp"
                  required />
            </p>
            <p>
            <button type="button" onClick = {(e) => _createProposal()} className={styles.btn_create}>Create</button>
            </p>
        </div>
        </center>
        );
      }
    }

    const renderViewProposalsTab = () => {
      if(loading){
        return (
          <div className={styles.description}>
            Loading... Waiting for transaction...
          </div>
        );
      }
      else if(parseInt(nbProposal) !=0) {
          return (
        <div>
        {listProposals.reverse().map(function(proposal, key) {
          console.log("is ex",proposal.id.toString(), proposal.isExecuted)
          let status, endDate, button, detailsView
          if((proposal.deadline.toString() >  Math.round(new Date()/1000)) && !listHasVoted[proposal.id.toString()] )
          {
            status = "In Progress"
            endDate = timeConverter(proposal.deadline.toString())
            button = <div className="col text-end"><input onClick={(event) => {_voteForProposal(proposal.id, "No")}}
                              className={styles.btn_no} type="button" value="No" />
                           <input onClick={(event) => {_voteForProposal(proposal.id, "Yes")}}
                              className={styles.btn_yes} type="button" value="Yes" /></div>
          }
          else if((proposal.deadline.toString() >  Math.round(new Date()/1000)) && listHasVoted[proposal.id.toString()])
          {
            status = "In Progress"
            endDate = timeConverter(proposal.deadline.toString())
            button = <div className="col text-end"><input onClick={(event) => {}}
                              className={styles.btn_already_voted} type="button" id="half" value="Already Vote" disabled /></div>
          }
          else if(proposal.yes.toString()> proposal.no.toString() && (proposal.deadline.toString() <  Math.round(new Date()/1000)) && !proposal.isExecuted )
          {
            status = <span className="text-success font-weight-bold">Passed</span>
            endDate = "Finished"
            button = <div className="col text-end"><input onClick={(event) => {}}
                              className={styles.btn_execute} type="button" value="Execute" onClick = { () => _executeProposal(proposal.id.toString())} /></div>
          }
          else if (proposal.isExecuted){
            status = "Executed"
            endDate = "Finished"
            button = <div className="col text-end"><input onClick={(event) => {}}
                              className={styles.btn_voting_end} type="button" value="Executed" disabled /></div>
          }
          else {
            status = "Rejected"
            endDate = "Finished"
            button = <div className="col text-end"><input onClick={(event) => {}}
                              className={styles.btn_voting_end} type="button" value="Rejected" disabled /></div>
          }

          if(propDetails==true && currentPropDetails === proposal.id.toString()){
            detailsView = <div className={styles.details}>
              <p className={styles.createby}>Created by : {proposal.createdBy.toString()}</p>
              <p className={styles.prop_desc2}> Description : {proposal.description.toString()}</p>
              <p className={styles.yes}>Yes : {utils.formatEther(proposal.yes)}</p>
              <p className={styles.no}>No : {utils.formatEther(proposal.no)}</p>
              {button}
              </div>
          }

          return(
          <div  key={key} className={styles.prop}>
            <p class={styles.prop_id}> Proposal # {proposal.id.toString()}</p>
            <p class={styles.prop_title}> Title : <b>{proposal.titre}</b></p>
            <span className={styles.prop_status}> Status : <b>{status}</b></span>
            <div className={styles.progress}>
              {progressBar(proposal.yes.toString(),(parseInt(proposal.yes)+parseInt(proposal.no)).toString())}
            </div>
            <p className={styles.enddate}> End time : {endDate}</p>
            {!propDetails ?  (
              <center><button className={styles.prop_detail} onClick= {(e)=>{ setPropDetails(true) ; setCurrentPropDetails(proposal.id.toString())}}>View details</button><br/></center>
            ) :  (
              <center><button className={styles.prop_detail} onClick= {(e)=>{ setPropDetails(false); setCurrentPropDetails(proposal.id.toString())}}>Hide details</button><br/></center>
            )}
             {detailsView}
          </div>
            )
          })}
          </div>
        );
      }
      else {
        return (
          <div className={styles.description}>
            There is no proposal
          </div>
        );
      }
    }

  const renderTab = () => {
    if (selectedDAOTab === "create") {
        return renderCreateProposalTab();
      }
    else if (selectedDAOTab === "view") {
        return renderViewProposalsTab();
      }
      return null;
    }

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

    const renderPage =  () => {
      if(currentPage=="Dashboard"){
        return (<Dashboard
          dexTokenBalance = {utils.formatEther(dexBalance)}
          lucileTokenBalance = {utils.formatEther(lucileBalance)}
          romainTokenBalance = {utils.formatEther(romainBalance)}
          ethBalance = {utils.formatEther(ethBalance)}
          etherBalanceContract = {utils.formatEther(etherBalanceContract)}
          reservedLucile = {utils.formatEther(reservedLucile)}
          reservedRomain = {utils.formatEther(reservedRomain)}
          lpBalance = {utils.formatEther(lpBalance)}
          />)
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
    getAmounts();


  }
}, [walletConnected]);


useEffect(() => {
  if (currentPage==="Gouvernance") {
    _fetchAllProposals();
  }
}, [currentPage]);

useEffect(() => {
  if (currentPage==="Pool") {
    _getNbPool();
    _fetchAllPools();

  }
}, [currentPage]);

useEffect(() => {
  if (currentPage==="Swap") {
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
    <navbar className={styles.navbar}>
        <button className={styles.btn_navbar}onClick={(event) => {setCurrentPage("Dashboard")}}>Dashboard</button>
        <button className={styles.btn_navbar} onClick={(event) => {setCurrentPage("Swap")}}>Swap</button>
        <button className={styles.btn_navbar} onClick={(event) => {setCurrentPage("Pool")}}>Pool</button>
        <button className={styles.btn_navbar} onClick={(event) => {setCurrentPage("Gouvernance")}}>Gouvernance</button>
        {renderButtonConnect()}
    </navbar>
    <div className={styles.page}>
     {renderPage()}
  </div>
  </div>
  <footer className={styles.footer}>
    Made with &#10084; by Crypto Rom1
  </footer>

</div>

);
}
