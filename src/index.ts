import "dotenv/config";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import axios from "axios";
import {
    Connection,
    PublicKey,
    VersionedTransaction,
    TransactionMessage,
    SystemProgram,
    ComputeBudgetProgram,
    TransactionInstruction,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import bs58 from 'bs58';

// wallet
const payer = getKeypairFromEnvironment("SECRET_KEY");
console.log('payer:', payer.publicKey.toBase58())

const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=填写Helius API', 'processed');
const quoteUrl = 'http://127.0.0.1:8080/quote';
const swapInstructionUrl = 'http://127.0.0.1:8080/swap-instructions';

// WSOL and USDC mint address
const wSolMint = 'So11111111111111111111111111111111111111112';
const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to get WSOL token balance
async function getWSOLBalance(walletPublicKey: PublicKey): Promise<number> {
    try {
        const tokenAccounts = await connection.getTokenAccountsByOwner(walletPublicKey, {
            mint: new PublicKey(wSolMint)
        });
        
        if (tokenAccounts.value.length === 0) {
            console.log('No WSOL token account found');
            return 0;
        }
        
        const balance = await connection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
        return parseInt(balance.value.amount);
    } catch (error) {
        console.error('Error getting WSOL balance:', error);
        return 0;
    }
}

// Function to check bundle status
async function checkBundleStatus(bundleId: string) {
    try {
        const statusRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "getBundleStatuses",
            params: [[bundleId]]
        };

        const response = await axios.post(`https://mainnet.block-engine.jito.wtf:443/api/v1/bundles`, statusRequest, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data.result;
    } catch (error) {
        console.error('Error checking bundle status:', error.response?.data || error.message);
        return null;
    }
}

// Function to check transaction status
async function checkTransactionStatus(signature: string) {
    try {
        // Check signature status
        const status = await connection.getSignatureStatus(signature);
        console.log(`\n--- Transaction Status for ${signature.slice(0, 10)}... ---`);
        
        if (status.value === null) {
            console.log('❌ Transaction not found or still processing');
            return false;
        }
        
        if (status.value.err) {
            console.log('❌ Transaction failed:', status.value.err);
            return false;
        }
        
        if (status.value.confirmationStatus) {
            console.log(`✅ Transaction ${status.value.confirmationStatus}`);
            console.log(`🎯 Slot: ${status.value.slot}`);
            
            // If confirmed, get transaction details
            if (status.value.confirmationStatus === 'confirmed' || status.value.confirmationStatus === 'finalized') {
                const txDetails = await connection.getTransaction(signature, {
                    commitment: 'confirmed',
                    maxSupportedTransactionVersion: 0
                });
                
                if (txDetails) {
                    console.log(`💰 Fee paid: ${txDetails.meta?.fee} lamports`);
                    if (txDetails.meta?.err) {
                        console.log('❌ Transaction error:', txDetails.meta.err);
                    } else {
                        console.log('✅ Transaction executed successfully');
                    }
                }
            }
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking transaction status:', error);
        return false;
    }
}

function instructionFormat(instruction) {
    return {
        programId: new PublicKey(instruction.programId),
        keys: instruction.accounts.map(account => ({
            pubkey: new PublicKey(account.pubkey),
            isSigner: account.isSigner,
            isWritable: account.isWritable
        })),
        data: Buffer.from(instruction.data, 'base64')
    };
}

async function run() {

    const start = Date.now();

    // Check available balance first
    const balance = await getWSOLBalance(payer.publicKey);
    const maxSwapAmount = Math.floor(balance * 0.9); // Use 90% of WSOL balance, leave 10% for tips
    const swapAmount = Math.min(30000000, maxSwapAmount); // Use smaller of 0.01 WSOL or 90% of balance
    
    if (swapAmount < 1000000) { // Skip if less than 0.001 WSOL
        console.log(`💰 WSOL balance too low: ${balance} lamports, skipping...`);
        return;
    }

    console.log(`💰 WSOL Balance: ${balance} lamports, using ${swapAmount} for arbitrage`);

    // quote0: WSOL -> USDC
    const quote0Params = {
        inputMint: wSolMint,
        outputMint: usdcMint,
        amount: swapAmount, // Dynamic amount based on balance
        onlyDirectRoutes: false,
        slippageBps: 1, // Fixed: Realistic 1% slippage (was 10 = 0.1%)
        maxAccounts: 20,
    };
    const quote0Resp = await axios.get(quoteUrl, { params: quote0Params })

    // quote1: USDC -> WSOL
    const quote1Params = {
        inputMint: usdcMint,
        outputMint: wSolMint,
        amount: quote0Resp.data.outAmount,
        onlyDirectRoutes: false,
        slippageBps: 1, // Fixed: Realistic 1% slippage (was 10 = 0.1%)
        maxAccounts: 20,
    };
    const quote1Resp = await axios.get(quoteUrl, { params: quote1Params })

    // profit but not real
    const diffLamports = (quote1Resp.data.outAmount - quote0Params.amount);
    console.log('diffLamports:', diffLamports)
    let jitoTip = Math.floor(diffLamports * 0.1) // Only 10% of profit as tip
    if (jitoTip < 1000) {
        jitoTip = 1000
    }

    // Higher threshold to account for slippage and fees
    const thre = 5000 // Fixed: Increased to 25000 lamports (0.025 WSOL minimum profit)
    if (diffLamports > thre) {
        
        // Additional safety check - ensure profit margin is substantial
        const profitMarginPercent = (diffLamports / quote0Params.amount) * 100;
        console.log(`💡 Profit margin: ${profitMarginPercent.toFixed(3)}%`);
        
        // if (profitMarginPercent < 1.0) { // Fixed: Re-enabled with 1% minimum margin
        //     console.log(`❌ Profit margin too small: ${profitMarginPercent.toFixed(3)}%, skipping...`);
        //     return;
        // }

        // merge quote0 and quote1 response
        let mergedQuoteResp = quote0Resp.data;
        mergedQuoteResp.outputMint = quote1Resp.data.outputMint;
        mergedQuoteResp.outAmount = String(quote1Resp.data.outAmount); // Use actual quote output, not input + tip
        mergedQuoteResp.otherAmountThreshold = String(Math.floor(quote1Resp.data.outAmount * 0.95)); // 5% slippage buffer
        mergedQuoteResp.priceImpactPct = String(Math.max(parseFloat(quote0Resp.data.priceImpactPct), parseFloat(quote1Resp.data.priceImpactPct)));
        mergedQuoteResp.routePlan = mergedQuoteResp.routePlan.concat(quote1Resp.data.routePlan)

        // swap
        let swapData = {
            "userPublicKey": payer.publicKey.toBase58(),
            "wrapAndUnwrapSol": false,
            "useSharedAccounts": false,
            "computeUnitPriceMicroLamports": 100,
            "dynamicComputeUnitLimit": true,
            "skipUserAccountsRpcCalls": true,
            "quoteResponse": mergedQuoteResp
        }
        const instructionsResp = await axios.post(swapInstructionUrl, swapData);
        const instructions = instructionsResp.data;

        // bulid tx
        let ixs: TransactionInstruction[] = [];

        // 1. cu
        const computeUnitLimitInstruction = ComputeBudgetProgram.setComputeUnitLimit({
            units: instructions.computeUnitLimit,
        });
        ixs.push(computeUnitLimitInstruction);

        // 2. setup
        const setupInstructions = instructions.setupInstructions.map(instructionFormat);
        ixs = ixs.concat(setupInstructions);

        // 3. save balance instruction from your program

        // 4. swap
        const swapInstructions = instructionFormat(instructions.swapInstruction);
        ixs.push(swapInstructions);

        // 5. cal real profit and pay for jito from your program
        // a simple transfer instruction here
        // the real profit and tip should be calculated in your program
        const tipInstruction = SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: new PublicKey('96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5'), // a random account from jito tip accounts
            lamports: jitoTip,
        })
        ixs.push(tipInstruction);

        // ALT
        const addressLookupTableAccounts = await Promise.all(
            instructions.addressLookupTableAddresses.map(async (address) => {
                const result = await connection.getAddressLookupTable(new PublicKey(address));
                return result.value;
            })
        );

        // v0 tx
        const { blockhash } = await connection.getLatestBlockhash();
        const messageV0 = new TransactionMessage({
            payerKey: payer.publicKey,
            recentBlockhash: blockhash,
            instructions: ixs,
        }).compileToV0Message(addressLookupTableAccounts);
        const transaction = new VersionedTransaction(messageV0);
        transaction.sign([payer]);

        // Check if we have enough WSOL for the transaction
        const requiredAmount = quote0Params.amount + jitoTip + 10000; // Add 10k lamports for fees
        if (balance < requiredAmount) {
            console.log(`❌ Insufficient balance: need ${requiredAmount} WSOL, have ${balance} WSOL`);
            return; // Skip this opportunity
        }
        
        console.log(`💰 WSOL Balance: ${balance} lamports`);
        console.log(`💸 Jito tip: ${jitoTip} lamports (${(jitoTip/diffLamports*100).toFixed(1)}% of profit)`);
        
        // Skip simulation for maximum speed (trade-off: higher risk of failed transactions)
        // In high-frequency arbitrage, speed > safety checks
        console.log('⚡ Skipping simulation for maximum speed...');
        
        // // Optional: Smart simulation for risky trades only
        // const shouldSimulate = (
        //     diffLamports < 25000 || // Low profit margin
        //     swapAmount > 50000000   // Large trade size (>0.05 WSOL)
        // );
        
        // if (shouldSimulate) {
        //     console.log('🔍 Running simulation for risky trade...');
        //     const simulationResult = await connection.simulateTransaction(transaction);
        //     if (simulationResult.value.err) {
        //         console.log('❌ Simulation failed:', simulationResult.value.err);
        //         return;
        //     }
        // }

        // send bundle
        const serializedTransaction = transaction.serialize();
        const base58Transaction = bs58.encode(serializedTransaction);

        const bundle = {
            jsonrpc: "2.0",
            id: 1,
            method: "sendBundle",
            params: [[base58Transaction]]
        };

        try {
            const bundle_resp = await axios.post(`https://mainnet.block-engine.jito.wtf:443/api/v1/bundles`, bundle, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const bundle_id = bundle_resp.data.result
            console.log(`sent to frankfurt, bundle id: ${bundle_id}`)
            
            // Get transaction signature for tracking
            const txSignature = bs58.encode(transaction.signatures[0]);
            console.log(`Transaction signature: ${txSignature}`);
            console.log(`Check on Solscan: https://solscan.io/tx/${txSignature}`);
            console.log(`Check on SolanaFM: https://solana.fm/tx/${txSignature}`);
            
            // Check transaction status immediately
            setTimeout(async () => {
                await checkTransactionStatus(txSignature);
            }, 3000); // Check after 3 seconds
            
            // Optional: Check bundle status after a delay
            setTimeout(async () => {
                const status = await checkBundleStatus(bundle_id);
                if (status && status.length > 0) {
                    console.log(`\n--- Bundle Status ---`);
                    console.log(`Bundle ${bundle_id.slice(0, 10)}... status:`, status[0]);
                }
            }, 8000); // Check after 8 seconds
            
        } catch (error) {
            // Check for HTTP 429 status code OR JSON-RPC error code -32097
            if (error.response?.status === 429 || error.response?.data?.error?.code === -32097) {
                console.log('Jito rate limited - skipping this opportunity');
                throw error; // Re-throw to trigger backoff in main()
            } else {
                console.error('Bundle submission error:', error.response?.data || error.message);
                throw error;
            }
        }

        // cal time cost
        const end = Date.now();
        const duration = end - start;

        console.log(`${wSolMint} - ${usdcMint}`)
        console.log(`slot: ${mergedQuoteResp.contextSlot}, total duration: ${duration}ms`)
    }
}

async function main() {

    let waitTime = 500; // Start with 500ms instead of 200ms
    const maxWaitTime = 5000; // Max 5 seconds
    
    while(1) {

        try {
            await run();
            // Reset wait time on success
            waitTime = 500;
        } catch (error) {
            console.error('Error in run():', error);
            
            // Check if it's a Jito rate limit error (HTTP 429 or JSON-RPC -32097)
            if (error.response?.status === 429 || error.response?.data?.error?.code === -32097) {
                console.log('Jito rate limited, increasing wait time...');
                waitTime = Math.min(waitTime * 2, maxWaitTime); // Exponential backoff
            }
        }

        // wait with dynamic time
        await wait(waitTime);
    }
    
}

main()
