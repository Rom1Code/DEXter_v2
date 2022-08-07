import { BigNumber } from "ethers";
import React, { useState } from "react";
import styles from "../styles/Home.module.css";
import {
  ROMAIN_TOKEN_ADDRESS,
  LUCILE_TOKEN_ADDRESS
} from "../constants";


export default function Pool(props) {
//console.log(props.getProviderOrSigner(true))
  const zero = BigNumber.from(0);
  //const [loading, setLoading] = useState(false);


  const renderPool = () => {
    return (
      <div>
            <div>
              <p className={styles.rate_pool}>Pool Lucile/ETH token </p>
              <p className={styles.balance}>Balance of ETH : {props.ethBalance}</p>
              <p className={styles.balance}>Balance of LucileToken : {props.lucileTokenBalance}</p>
              <p className={styles.balance}>Balance of ReserveLucileToken : {props.reservedLucile}</p>
              <p className={styles.balance}>Balance of ReserveETH : {props.etherBalanceContract}</p>

            </div>
            <div >
              <input
                type="number"
                placeholder="Amount of Ether"
                onChange={(event) => setAddEther(e.target.value || "0")}
                className=""
                required />
              </div>
              {setLiquidityPool(props.reservedLucile)}
              <div>
                <button
                type="button"
                  className={styles.btn_stake}>
                  //onClick={props.addLiquidity(LUCILE_TOKEN_ADDRESS)}>
                    ADD</button>
                <button
                  type="button"
                  className={styles.btn_unstake}>
                    REMOVE
                  </button>
            </div>
            <div class="">
              <span>LP token : {props.lpBalance}</span>
            </div>
            </div>

    );
  }

  const setLiquidityPool = (reservedToken) => {
    console.log("reservedToken",reservedToken)
    if(reservedToken==0){
      return (
        <div >
          <input
            type="number"
            placeholder="Amount of CryptoDev tokens"
            onChange={(event) => setAddTokens(e.target.value || "0")}
            className=""
            required />
          </div>
      );
    }
  };


  return (
    <center >
    <div className={styles.pool} >
    {renderPool()}
    </div>
  </center>

  );
}
