// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {Program} from "@project-serum/anchor";
import {SolanaNftCollaterizedLoans} from "../target/types/solana_nft_collaterized_loans";

const utils = require('../tests/utils');

const anchor = require("@project-serum/anchor");

module.exports = async function (provider) {
    // Configure client to use the provider.Solana
    anchor.setProvider(provider);

    // Add your deploy script here.
    const program = anchor.workspace.SolanaNftCollaterizedLoans as Program<SolanaNftCollaterizedLoans>;
    const CONFIG_PDA_SEED = "config";
    const STABLE_COIN_PDA_SEED = "stable";
    const NFT_PDA_SEED = "nft";
    const ORDER_PDA_SEED = "order";
    const USDC_MINT_KEY = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr';

    let initializeSection: boolean = false;
    let mintSection: boolean = false;
    let do_test: boolean = true;
    //--------------Start Initialize Section----------------
    if (initializeSection) {
        let stableCoinMintPubKey = new anchor.web3.PublicKey(USDC_MINT_KEY);
        const [config, configBump] = await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from(CONFIG_PDA_SEED)
            ], program.programId);
        const [stable, stableBump] = await anchor.web3.PublicKey.findProgramAddress([
            stableCoinMintPubKey.toBuffer(),
            Buffer.from(STABLE_COIN_PDA_SEED),
        ], program.programId);
        await program.rpc.initialize(configBump, stableBump, {
            accounts: {
                signer: provider.wallet.publicKey,
                configuration: config,
                stableCoinMint: stableCoinMintPubKey,
                stableCoinVault: stable,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
            // @ts-ignore
            signers: [provider.wallet.payer],
        });
        const fetch = await program.account.configuration.fetch(config);
        console.log(fetch);
    }
    //--------------End Initialize Section------------------

    //---------------------Start Mint Section----------------------
    // Create NFT Token For Test
    if (mintSection) {
        let mePubKey = "Ekkx4E93eFRJ1VHascQjQjsbcqKATYv4cBVK6kAH2bvf";
        let mintKeyNft = anchor.web3.Keypair.generate();
        let nftMintObject = await utils.createMint(mintKeyNft, provider, provider.wallet.publicKey, null, 0, TOKEN_PROGRAM_ID);
        let nftMintPubKey = nftMintObject.publicKey;

        let meNFt = await nftMintObject.createAssociatedTokenAccount(new anchor.web3.PublicKey(mePubKey));

        console.log(meNFt.toString());
        //Mint NFt Token to me
        await utils.mintToAccount(provider, nftMintPubKey, meNFt, 1);
    }
    //---------------------End Mint Section----------------------


    //do Test

    if(do_test){
        const [config, configBump] = await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from(CONFIG_PDA_SEED)
            ], program.programId);
        const fetch = await program.account.configuration.all();
        console.log(fetch[0].account.stableCoinMint.toString());
        console.log(fetch[0].account.stableCoinVault.toString());
    }
    //------------------------End To Test--------------------------
};
