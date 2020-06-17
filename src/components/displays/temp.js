if(cell) {
  const x = +cell.split(';')[0].split(':').pop(); 
  const y = +cell.split(';')[1].split(':').pop();

  cells.subscribe((array) => {
    let island = {
      mRight: false,
      mLeft: false,
      mTop: false,
      mBot: false
    }

    array.forEach(cell => {
      if(cell.coords.x = x-1 && cell.coords.y == y){
        island.mLeft = true;
      }
      if(cell.coords.x = x+1 && cell.coords.y == y){
        island.mRight = true;
      }
      if(cell.coords.y = y-1 && cell.coords.x == x){
        island.mBot = true;
      }
      if(cell.coords.y = y+1 && cell.coords.x == y){
        island.mTop = true;
      }
    })
    console.log(island, array, modul, cell)
  })
}