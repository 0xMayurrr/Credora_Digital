# 🧠 Zero-Knowledge Proofs (ZKP) in Credora

The Credora / Veripass wallet uses **Zero-Knowledge Proofs** to provide "Privacy-First Verification". This means you can prove something is true (like "I am a top developer") without revealing the underlying data (like your exact repository list or private commit history).

## 🛠️ Where ZK is implemented in this project

### 1. User Identity (`Semaphore`)
In `veripass-wallet/src/pages/Dashboard.tsx` and `Profile.tsx`, we use the `@semaphore-protocol/identity` library.
- **Identity Generation**: When you "Verify Identity (ZK)", the system creates a new Semaphore `Identity` using your wallet address as a seed.
- **Commitment**: This identity generates a public "Commitment". Think of this as a public lock that only your private identity can open.
- **On-chain Proof**: We display this commitment as proof that a ZK-compatible identity has been linked to your wallet.

### 2. Dev Rep Score (Privacy-Preserving Proof)
The **Dev Rep Score** is our implementation of a ZK-like verifiable metric.
- **The Problem**: If you show a recruiter your raw GitHub data, you leak your private activity.
- **The solution**: We compute a score on the backend and issue a signed proof. 
- **The Future (ZK-SNARKs)**: In a full production environment, we would use Circom to create a ZK circuit that takes (GitHub Data) as private input and outputs (Score > 300) as a public proof.

## 📚 What you need to learn to master ZK in Web3

To expand on this implementation, you should focus on these 3 pillars:

### I. The Math (Concepts)
- **Commitments**: Hashing a secret so others can't see it, but you can prove you know it later.
- **Nullifiers**: A way to prevent "double-spending" a proof without revealing who sent it.
- **Circuits**: The logic gates for ZK. Instead of `if (x > 5)`, you write a mathematical constraint `x - 5 = positive_value`.

### II. The Tools
1. **Circom**: The most popular language for writing ZK circuits.
2. **SnarkJS**: The JavaScript library to generate and verify proofs in the browser/Node.js.
3. **Semaphore**: A specialized protocol (which we use) for anonymous signaling and memberships.

### III. The Project Structure
If you look into a `circuits/` folder (standard in ZK projects), you'll see `.circom` files.
- **Input**: Your private data (e.g., your actual grade).
- **Witness**: The computed state of the circuit.
- **Proof**: A small string (~200 bytes) that proves the witness is valid.

## 🚀 How to "Level Up" your Credora ZK
1. **Anonymous Voting**: Use Semaphore to let citizens vote on document validity without revealing their identity.
2. **Selective Disclosure**: Use ZK-SNARKs to let a user prove they are "Over 18" without revealing their "Date of Birth".

---
*Created for the Credora Upgrade* 🏛️🛡️
