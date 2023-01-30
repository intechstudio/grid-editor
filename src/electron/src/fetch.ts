import fetch from 'node-fetch';



// using the measurement protocol
export async function fetchUrlJSON(url) {

  console.log('accessing the web...', url);


  const response = await fetch(url, {
    method: "GET"
  })

  if (!response.ok){
    console.log("Fatch Error: ", response.status);
    return;
  }
  else{
    const data = await response.json().catch(error=>{
      console.log("Invalid JSON", error);
    });
    return data;
  }

}
