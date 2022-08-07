import { Contract } from "ethers";
import {
  DAO_CONTRACT_ABI,
  DAO_CONTRACT_ADDRESS,
} from "../constants";


export const createProposal = async (signer, titre, description, deadline, tokenAddress) => {
    const daoContract = new Contract(
      DAO_CONTRACT_ADDRESS,
      DAO_CONTRACT_ABI,
      signer
    );
    const tx = await daoContract.createProposal(titre, description, deadline, tokenAddress);
    await tx.wait();
};

export const fetchAllProposals = async (provider, address, nbProposal) => {
  const daoContract = new Contract(
    DAO_CONTRACT_ADDRESS,
    DAO_CONTRACT_ABI,
    provider);
  const listProposals=[]
  const hasVotedForProposal=[]
  hasVotedForProposal.push(0)
  for(var i = 1; i <= nbProposal; i++) {
    const tempProp = await daoContract.proposals(i)
    const tempHasVote = await daoContract.hasVotedForProposal(i, address)
    hasVotedForProposal.push(tempHasVote)
    listProposals.push(tempProp)
  }
  return [listProposals, hasVotedForProposal]
};

export const getNbProposal = async (provider) => {
  const daoContract = new Contract(
    DAO_CONTRACT_ADDRESS,
    DAO_CONTRACT_ABI,
    provider);
  const nbProposal = await daoContract.nbProposal();
  return nbProposal;
}

export const voteForProposal = async (signer, proposalId, _vote) => {
  const daoContract = new Contract(
    DAO_CONTRACT_ADDRESS,
    DAO_CONTRACT_ABI,
    signer);
  let vote = _vote === "Yes" ? 0 : 1;
  const tx = await daoContract.voteForProposal(parseInt(proposalId), vote.toString());
  await tx.wait();
}

export const  executeProposal = async (signer, proposalId) => {
  const daoContract = new Contract(
    DAO_CONTRACT_ADDRESS,
    DAO_CONTRACT_ABI,
    signer);
    const tx = await daoContract.executeProposal(proposalId);
    await tx.wait();
}
