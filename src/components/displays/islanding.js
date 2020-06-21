function testAllIslanding(modulesArray){

  for (var f=0; f<modulesArray.length; f++){
    testModuleIslanding(modulesArray,f);
  }  

  return modulesArray;
}

function testModuleIslanding(modulesArray,testModuleIndex){

  modulesArray[testModuleIndex].islanding = 0;

  // Set all module islandSearchStatus to -1

  for(var i=0; i<modulesArray.length; i++){
    modulesArray[i].islandSearchStatus=-1;  //USBMODULE
  }  


  modulesArray[testModuleIndex].islandSearchStatus = -2;

  // Find USB module and mark its neighbours
  for(var i=0; i<modulesArray.length; i++){

    if (modulesArray[i].coords.x == 0 && modulesArray[i].coords.y == 0){
      modulesArray[i].islandSearchStatus=0;  //USBMODULE

      markNeighbours(modulesArray, modulesArray[i].coords.x, modulesArray[i].coords.y);
            
    }

  }   

  for (var k=0; k<modulesArray.length; k++){ // REPEAT FOR EACH MODULE


    for(var i=0; i<modulesArray.length; i++){

      if (modulesArray[i].islandSearchStatus == 1){
        modulesArray[i].islandSearchStatus = 2;
        markNeighbours(modulesArray, modulesArray[i].coords.x, modulesArray[i].coords.y);
      }

    }   

  }

  var notFoundCount = 0;

  for(var i=0; i<modulesArray.length; i++){ 

    if (modulesArray[i].islandSearchStatus == -1){
      notFoundCount++;
      modulesArray[testModuleIndex].islanding = 1;
    }

  }  
  //console.log("notFoundCount: "+notFoundCount);
}


function markNeighbours(modulesArray,x,y){

  for(var i=0; i<modulesArray.length; i++){

    if (modulesArray[i].islandSearchStatus == -1){ // IF NOT PROCESSED YET

      if(modulesArray[i].coords.x == x && modulesArray[i].coords.y == y+1){ //bottom neighbor
        if (modulesArray[i].islandSearchStatus == -1){
          modulesArray[i].islandSearchStatus=1; // FOUND
        }
        
      }
      if(modulesArray[i].coords.x == x && modulesArray[i].coords.y == y-1){ //top neighbor
        if (modulesArray[i].islandSearchStatus == -1){
          modulesArray[i].islandSearchStatus=1; // FOUND
        }
      }
      if(modulesArray[i].coords.x == x+1 && modulesArray[i].coords.y == y){ //left neighbor
        if (modulesArray[i].islandSearchStatus == -1){
          modulesArray[i].islandSearchStatus=1; // FOUND
        }
      }
      if(modulesArray[i].coords.x == x-1 && modulesArray[i].coords.y == y){ //right neighbor
        if (modulesArray[i].islandSearchStatus == -1){
          modulesArray[i].islandSearchStatus=1; // FOUND
        }
      }

    }


  
  }
  //console.log(modulesArray);

}

function drawModules(modulesArray){

  $("#desk").html("");

  for(var i=0; i<modulesArray.length; i++){

    if (modulesArray[i].islandSearchStatus == -1){ //Gray
      $("#desk").append('<div class="module" style="background: gray; top: '+(modulesArray[i].y*100+300)+'px; left: '+(modulesArray[i].x*100+300)+'px;">'+modulesArray[i].type+'<br>'+modulesArray[i].x+'<br>'+modulesArray[i].y+'<br>'+modulesArray[i].islandSearchStatus+'</div>');
    }

    if (modulesArray[i].islanding == 0){ //GREEN
      $("#desk").append('<div class="module" style="background: green; top: '+(modulesArray[i].y*100+300)+'px; left: '+(modulesArray[i].x*100+300)+'px;">'+modulesArray[i].type+'<br>'+modulesArray[i].x+'<br>'+modulesArray[i].y+'<br>'+modulesArray[i].islandSearchStatus+'</div>');
    }
    
    if (modulesArray[i].islanding > 0){ //RED
      $("#desk").append('<div class="module" style="background: red; top: '+(modulesArray[i].y*100+300)+'px; left: '+(modulesArray[i].x*100+300)+'px;">'+modulesArray[i].type+'<br>'+modulesArray[i].x+'<br>'+modulesArray[i].y+'<br>'+modulesArray[i].islandSearchStatus+'</div>');
    }

    if (modulesArray[i].islandSearchStatus == 0){ //PURPLE USB
      $("#desk").append('<div class="module" style="background: purple; top: '+(modulesArray[i].y*100+300)+'px; left: '+(modulesArray[i].x*100+300)+'px;">'+modulesArray[i].type+'<br>'+modulesArray[i].x+'<br>'+modulesArray[i].y+'<br>'+modulesArray[i].islandSearchStatus+'</div>');
    }


  }

}

exports.islanding = {
  testAllIslanding
}


