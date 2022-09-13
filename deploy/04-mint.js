const { network, ethers } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // Basic NFT
    const basicNft = await ethers.getContract("BasicNft", deployer)
    const basicMintTx = await basicNft.mintNft()
    await basicMintTx.wait(1)
    console.log(`Basic NFT index 0 tokenURI: ${await basicNft.tokenURI(0)}`)

    // Dynamic SVG  NFT
    const highValue = ethers.utils.parseEther("4000")
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
    const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue)
    await dynamicSvgNftMintTx.wait(1)
    console.log(`Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`)

    // Random IPFS NFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()
    const randomIpfsNftMintTx = await randomIpfsNft.requestNft({ value: mintFee.toString() })
    const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1)

    // Need to listen for response
    await new Promise(async (resolve) => {
        setTimeout(resolve, 300000) // Timeout time 5 minutes 

        // Setup listener for our event
        randomIpfsNft.once("NftMinted", async () => {
            resolve()
        })

        if (chainId == 31337) {
            const requestId = randomIpfsNftMintTxReceipt.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
        }
    })
    console.log(`Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`)
}
module.exports.tags = ["all", "mint"]
// const { network, ethers } = require("hardhat")


// module.exports = async function ({ getNamedAccounts }) {
//     const { deployer } = await getNamedAccounts()
//     const chainId = network.config.chainId

//     // Basic NFT
//     const basicNft = await ethers.getContract("BasicNft", deployer)
//     const basicMintTx = await basicNft.mintNft()
//     await basicMintTx.wait(1)
//     console.log(`Basic index 0 has tokenURI: ${await basicNft.tokenURI(0)}`)

//     // Random Nft

//     const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
//     const mintFee = await randomIpfsNft.getMintFee()

//     await new Promise(async (resolve) => {
//         setTimeout(resolve, 300000)
//         randomIpfsNft.once("NftMinted", async function () {
//             resolve()
//         })
//         const randomIpfsNftMintTx = await randomIpfsNft.requestNft({
//             value: mintFee.toString(),
//         })
//         const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1)
//         if (developmentChains.includes(network.name)) {
//             const requestId =
//                 randomIpfsNftMintTxReceipt.events[1].args.requestId.toString()
//             const vrfCoordinatorV2Mock = await ethers.getContract(
//                 "VRFCoordinatorV2Mock",
//                 deployer
//             )
//             await vrfCoordinatorV2Mock.fulfillRandomWords(
//                 requestId,
//                 randomIpfsNft.address
//             )
//         }
//     })

//     console.log(
//         `Random IPFS NFT index 0 has tokenURI: ${await randomIpfsNft.tokenURI(
//             0
//         )}`
//     )

//     // DynamicSvg NFT
//     const highValue = ethers.utils.parseEther("4000")
//     const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
//     const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(
//         highValue.toString()
//     )
//     await dynamicSvgNftMintTx.wait(1)

//     console.log(
//         `Dynamic SVG NFT index 0 has tokenURI: ${await dynamicSvgNft.tokenURI(
//             0
//         )}`
//     )
// }

// module.exports.tags=["all", "mint"]
