import fetch from 'node-fetch';



// using the measurement protocol
export async function fetchUrlJSON(url) {

  console.log('accessing the web...', url);


  return fetch(url, {
    method: "GET"
  })
  .then(response => {
    if (!response.ok) {
      console.log("Fetch Error: ", response.status);
      return;
    } else {
      return response.json().catch(error => {
        console.log("Invalid JSON", error);
      });
    }
  });

}
