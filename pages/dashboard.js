export default function Dashboard(props) {
  return (

    <div>
    <p> eth balance : {props.ethBalance}</p>
    <p> eth contract balance : {props.etherBalanceContract}</p>
    <p> lucile token balance : {props.lucileTokenBalance}</p>
    <p> romain token balance : {props.romainTokenBalance}</p>
    <p> lp balance : {props.lpBalance}</p>
    <p> reserved Lucile in contract : {props.reservedLucile}</p>
    <p> reserved Romain in contract : {props.reservedRomain}</p>

    </div>

  );
}
