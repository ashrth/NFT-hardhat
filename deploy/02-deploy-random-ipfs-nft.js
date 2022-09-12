const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const {
    storeImages,
    storeTokenUriMetadata,
} = require("../utils/uploadToPinata")

const imageLocation = "./images/randomNft/"

let tokenUris = [
    "ipfs://QmZSfxyXu6gntJQavqEaVDrEvxwBWyctevafqkkkbH7CBe",
    "ipfs://QmSE5SXosMJvTeSRvXNwQCHvy5wwGp6ytuktsGy8TXeWw3",
    "ipfs://Qmaw3WjXDZUqimKMDp3SmAvKfancT16hrfM7JSynfdEDWa",
]

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
}

const FUND_AMOUNT = "100000000000000000000"

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2Address, subscriptionId
    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }
    // To upload our images, we need to get the TPFS hashes of our image,
    // We can do it by:
    //  by our own IPFS node. https://docs/pfs/io/
    // by Pinata
    // by nft.storage

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        )
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait()
        subscriptionId = txReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }
    log("-------------------------")

    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
networkConfig[chainId].mintFee,
        tokenUris,
    ]
    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying....")
        await verify(randomIpfsNft.address, args)
    }
}

async function handleTokenUris() {
    tokenUris = []
    // for this function, we need
    // to store the image in ipfs
    // and store the metadata in ipfs
    const { responses: imageUploadResponses, files } = await storeImages(
        imageLocation
    )
    for (imageUploadResponseIndex in imageUploadResponses) {
        // create metadata
        // upload the metadata
        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(
            ".png",
            ""
        )
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup.`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        console.log(`Uploading ${tokenUriMetadata.name}`)
        // store the JSON file to PINATA/ IPFS
        const metadataUploadResponse = await storeTokenUriMetadata(
            tokenUriMetadata
        )
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("Token URIs uploaded, they are:")
    console.log(tokenUris)

    return tokenUris
}

module.exports.tags = ["all", "randomipfs", "main"]
