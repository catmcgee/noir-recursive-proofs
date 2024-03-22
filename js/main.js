import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import mainCircuit from '../circuits/main/target/noir_recursion.json' assert { type: 'json' };
import recursionCircuit from '../circuits/recursion/target/noir_recursion.json' assert { type: 'json' };

async function main() {
    // setup backends for main and recursive proofs
    const mainBackend = new BarretenbergBackend(mainCircuit, { threads: 32 });
    const recursionBackend = new BarretenbergBackend(recursionCircuit, { threads: 32 });
    const noirMain = new Noir(mainCircuit, mainBackend);
    const noirRecursive = new Noir(recursionCircuit, recursionBackend);

    const inputs = {
        x: 1,
        y: 2 
    }
   
    // intermediate proof
    const { witness } = await noirMain.execute(inputs);
    const { proof, publicInputs } = await mainBackend.generateProof(witness);
    const { proofAsFields, vkAsFields, vkHash } = await mainBackend.generateRecursiveProofArtifacts({ publicInputs, proof }, 1);

    // final proof
    const recursiveInputs = {
        verification_key:  vkAsFields.map(e => e.toString()),
        proof: proofAsFields, 
        public_inputs: publicInputs, 
        key_hash: vkHash,
    };
    const { recursiveWitness } = await noirRecursive.execute(recursiveInputs);
    
    // this part is getting unreachable
    const finalProofData = await recursionBackend.generateProof(recursiveWitness);
    const verified = await recursionBackend.generateProof(finalProofData); 
    console.log(verified);
}   
// Execute the main function
main().catch(console.error);
