import { Contract, utils } from "ethers";
import {
  WHITELIST_CONTRACT_ABI,
  WHITELIST_CONTRACT_ADDRESS
} from "../constants";


// get and return the number of project that exist
export const getNbICO = async (provider) => {
  // Create a new instance of the whitelist contract
  const exchangeContract = new Contract(
    WHITELIST_CONTRACT_ADDRESS,
    WHITELIST_CONTRACT_ABI,
    provider);
  const nbProject= await exchangeContract.nbProject()
  return nbProject
}

export const fetchAllICOs = async (provider, address) => {
  // Create a new instance of the whitelist contract
  const whitelistContract = new Contract(
    WHITELIST_CONTRACT_ADDRESS,
    WHITELIST_CONTRACT_ABI,
    provider);
  // retrieve the number projects that exist
  const _nbProject= await getNbICO(provider);

  const listProjects = []
  listProjects.push(0)

  const listIsWhitelisted = []
  listIsWhitelisted.push(0)

  for(var i=1; i<=parseInt(_nbProject); i++){
    // call pools getter and save each occurrence in listPools
    const tempProject = await whitelistContract.ICOs(i)
    listProjects.push(tempProject)

    const tempIsWhitelisted = await whitelistContract.isWhitelisted(i, address)
    listIsWhitelisted.push(tempIsWhitelisted)
  }
  return [listProjects, listIsWhitelisted];
}

export const createICO = async (signer, _tokenAddress, _maxWhitelistAddresses, _deadline) => {
    // Create a new instance of the whitelist contract
    const whitelistContract = new Contract(
      WHITELIST_CONTRACT_ADDRESS,
      WHITELIST_CONTRACT_ABI,
      signer);
    const tx= await whitelistContract.createICO(_tokenAddress, _maxWhitelistAddresses, _deadline);

    await tx.wait();
}

export const whitelist = async (signer, _numProject) => {
  const whitelistContract = new Contract(
    WHITELIST_CONTRACT_ADDRESS,
    WHITELIST_CONTRACT_ABI,
    signer);
  const tx= await whitelistContract.addWhitelistAddress(_numProject);

  await tx.wait();
}

export const startPresale = async (signer, _numICO) => {
  const whitelistContract = new Contract(
    WHITELIST_CONTRACT_ADDRESS,
    WHITELIST_CONTRACT_ABI,
    signer);
  const tx= await whitelistContract.startPresale(_numICO);

  await tx.wait();
}

export const presaleMint = async (signer, _numICO, _amount, _tokenPrice) => {
  console.log(_numICO, _amount, utils.formatEther(_tokenPrice))
  const eth = (_amount * utils.formatEther(_tokenPrice)) / 2
  console.log(eth)

  const whitelistContract = new Contract(
    WHITELIST_CONTRACT_ADDRESS,
    WHITELIST_CONTRACT_ABI,
    signer);
  const tx= await whitelistContract.presaleMint(_numICO, _amount, {
        // value signifies the cost of one crypto dev which is "0.01" eth.
        // We are parsing `0.01` string to ether using the utils library from ethers.js
        value: utils.parseEther(eth.toString()),
      });

  await tx.wait();
}

export const mint = async (signer, _numICO, _amount, _tokenPrice) => {
  console.log(_numICO, _amount, utils.formatEther(_tokenPrice))
  const eth = _amount * utils.formatEther(_tokenPrice)
  console.log(eth)
  const whitelistContract = new Contract(
    WHITELIST_CONTRACT_ADDRESS,
    WHITELIST_CONTRACT_ABI,
    signer);
  const tx= await whitelistContract.mint(_numICO, _amount,  {
        // value signifies the cost of one crypto dev which is "0.01" eth.
        // We are parsing `0.01` string to ether using the utils library from ethers.js
        value: utils.parseEther(eth.toString()),
      });

  await tx.wait();
}
