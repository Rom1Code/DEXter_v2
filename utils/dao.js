import { Contract } from "ethers";
import {
  DAO_CONTRACT_ABI,
  DAO_CONTRACT_ADDRESS,
} from "../constants";


// call createProposal function create the proposal when the deadline is passed and the user execute it
export const createProposal = async (signer, titre, description, deadline, tokenAddress) => {
    // Create a new instance of the DAO contract
    const daoContract = new Contract(
      DAO_CONTRACT_ADDRESS,
      DAO_CONTRACT_ABI,
      signer
    );
    // call createProposal function
    const tx = await daoContract.createProposal(titre, description, deadline, tokenAddress);
    await tx.wait();
};

// get and return the list of proposals and the list of proposals for which the user has voted
export const fetchAllProposals = async (provider, address, nbProposal) => {
  // Create a new instance of the DAO contract
  const daoContract = new Contract(
    DAO_CONTRACT_ADDRESS,
    DAO_CONTRACT_ABI,
    provider);
  const listProposals=[]
  const hasVotedForProposal=[]
  // we push 0 in the first entry because we want to match the entry with the id of the proposal
  hasVotedForProposal.push(0)
  for(var i = 1; i <= nbProposal; i++) {
    // we fetch each proposal and push it to listProposals
    const tempProp = await daoContract.proposals(i)
    // we fetch each proposal for wich the user vote and push it to hasVotedForProposal
    const tempHasVote = await daoContract.hasVotedForProposal(i, address)
    hasVotedForProposal.push(tempHasVote)
    listProposals.push(tempProp)
  }
  return [listProposals, hasVotedForProposal]
};

// get and return the number of proposal that exist
export const getNbProposal = async (provider) => {
  // Create a new instance of the DAO contract
  const daoContract = new Contract(
    DAO_CONTRACT_ADDRESS,
    DAO_CONTRACT_ABI,
    provider);
  // we call nbProposal function and return is value
  const nbProposal = await daoContract.nbProposal();
  return nbProposal;
}

// call voteForProposal when the user vote yes or no for one proposal
export const voteForProposal = async (signer, proposalId, _vote) => {
  // Create a new instance of the DAO contract
  const daoContract = new Contract(
    DAO_CONTRACT_ADDRESS,
    DAO_CONTRACT_ABI,
    signer);
  // we check if the user vote yes or no
  let vote = _vote === "Yes" ? 0 : 1;
  // we call voteForProposal function with the id of proposal in parameter
  const tx = await daoContract.voteForProposal(parseInt(proposalId), vote.toString());
  await tx.wait();
}

export const executeProposal = async (signer, proposalId) => {
  // Create a new instance of the DAO contract
  const daoContract = new Contract(
    DAO_CONTRACT_ADDRESS,
    DAO_CONTRACT_ABI,
    signer);
    // call executeProposal function with the id of proposal in parameter
    const tx = await daoContract.executeProposal(proposalId);
    await tx.wait();
}
