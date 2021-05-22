const fs = require('fs')

const writeArrayToJson = (array, file)=> {
  const arrayData = JSON.stringify(array)

  fs.writeFile(`data/${file}.json`, arrayData, 'utf8', (err) => {
    if (err) {
      console.log(`Error writing file: ${err}`)
    } else {
      console.log(`File is written successfully!`)
    }
  })
}

const cleanText = (string) => {
  return string.replace('\n', '').replace('\r', '').replace('  ', ' ')
}

const divider = async () => {
  console.log('-------------------------------------------------------')
}

module.exports = {
  cleanText,
  divider,
  writeArrayToJson
}