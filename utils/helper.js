import styles from "../styles/Home.module.css";

// convert timestamp to date
export const timeConverter = (UNIX_timestamp) => {
 var a = new Date(UNIX_timestamp * 1000);
 var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 var year = a.getFullYear();
 var month = months[a.getMonth()];
 var date = a.getDate();
 var hour = a.getHours();
 var min = a.getMinutes();
 var sec = a.getSeconds();
 var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
 return time;
};

// dsiplay the progressBar
export const progressBar = (yes,total) => {
  const pourcentage = (yes / total) * 100
  console.log("pourcentage",pourcentage)
  if(pourcentage <= 25) {
  return <div className="progress-bar w-0" role="progressbar"  ></div>
  }
  else if(pourcentage <= 50) {
    return <div className="progress-bar w-25" role="progressbar"  ></div>
  }
  else if(pourcentage <= 75) {
  return <div className="progress-bar w-50" role="progressbar"  ></div>
  }
  else if(pourcentage > 75 && pourcentage < 100){
    return <div className="progress-bar w-75" role="progressbar"  ></div>
  }
  else if(pourcentage == 100) {
    return <div className={styles.progress_25}>.</div>
  }
  else {
    return <div className="progress-bar w-0" role="progressbar"  ></div>
  }
}
