const fs = require('fs')
const bip39 = require('bip39')
const bip32 = require('bip32')
const bitcoin = require('bitcoinjs-lib')

const wordList = fs.readFileSync('./english.txt').toString().split('\n')

function bruteForce(args) {
    for (let w23i = 0; w23i <= wordList.length; w23i++) {
        if (w23i % 10 == 0) {
            const progress = w23i * 1.0 / wordList.length 
            console.log(`${Math.floor(progress*10000) / 100}% progress`)
        }
        
        const w23 = wordList[w23i]
        for (const w24 of wordList) {
            const phrase = args.words.concat(w23).concat(w24).join(' ')
            if (bip39.validateMnemonic(phrase)) {
                const seed = bip39.mnemonicToSeedSync(phrase)
                const hdnode = bip32.fromSeed(seed)
                for (const account of [49, 84]) {
                    for (let i = 0; i <= args.depth; i++) {
                        const path = `m/${account}'/0'/0'/0/${i}`
                        const node = hdnode.derivePath(path)
                        const p2pkhAddress = bitcoin.payments.p2pkh({pubkey: node.publicKey}).address
                        const p2shAddress = bitcoin.payments.p2sh({ redeem: bitcoin.payments.p2wpkh({ pubkey: node.publicKey })}).address
                        for (const address of [p2pkhAddress, p2shAddress]) {
                            if (args.address === address) {
                                console.log('\n\nSuccess!')
                                console.log(`\nFull phrase is:\n${phrase}`)
                                return
                            }
                        }
                    }
                }
                
            }
        }
    }
    console.log(`Could not find seed phrase for address`)
}

function parseArgs() {
    const address = process.argv[2]
    const words = process.argv[3].split(" ")
    for (const word of words) {
        if (!wordList.includes(word)) {
            throw new Error(`${word} is not in the valid word list`)
        }
    }
    let depth = 20
    if (process.argv.length > 4) {
        depth = parseInt(process.argv[4])
    }
    console.log(`Attempting search with address depth ${depth}`)
    return { address, words, depth }
}
const args = parseArgs()

bruteForce(args)