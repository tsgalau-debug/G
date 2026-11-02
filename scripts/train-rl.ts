import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';

// Define the environment
class MockRAGEnv {
  public stateSpace = 4;
  public actionSpace = 4;
  private maxSteps = 100;
  private currentStep = 0;

  // return [User_Intent, Context_Coherence, Anomaly_Detected, Error_Rate]
  reset(): number[] {
    this.currentStep = 0;
    return this.generateRandomState();
  }

  private generateRandomState(): number[] {
    return [
      Math.random(), // User Intent Complexity
      Math.random(), // Context Coherence
      Math.random() > 0.8 ? 1 : 0, // Rare anomalies
      Math.random() * 0.2 // Low error rate usually
    ];
  }

  step(action: number, state: number[]): { nextState: number[], reward: number, done: boolean } {
    this.currentStep++;
    let reward = -0.1; // small time penalty

    const [intent, coherence, anomaly, errorRate] = state;

    // The Logic rules we want the agent to learn (Behavioral Cloning/Reward shaping)
    if (anomaly === 1) {
      if (action === 3) reward += 10; // Self_Correct_Context
      else reward -= 5;
    } else if (coherence < 0.4) {
      if (action === 1) reward += 5; // Retrieve_Deep_Memory
      else reward -= 2;
    } else if (coherence >= 0.4) {
      if (action === 2) reward += 5; // Generate_Directly
      else reward -= 1;
    } else if (action === 0) {
       // Wait / Listen is good if everything is perfectly normal and low intent, but usually risky
       if (intent < 0.2 && coherence > 0.5) reward += 2;
    }

    const done = this.currentStep >= this.maxSteps;
    const nextState = this.generateRandomState();

    return { nextState, reward, done };
  }
}

// Memory buffer for Experience Replay (DQN standard)
class ReplayBuffer {
  private buffer: any[] = [];
  constructor(private maxCapacity: number = 2000) {}

  add(experience: any) {
    if (this.buffer.length >= this.maxCapacity) this.buffer.shift();
    this.buffer.push(experience);
  }

  sample(batchSize: number): any[] {
    const samples = [];
    for (let i = 0; i < batchSize; i++) {
        const idx = Math.floor(Math.random() * this.buffer.length);
        samples.push(this.buffer[idx]);
    }
    return samples;
  }

  size() { return this.buffer.length; }
}

async function trainRL() {
  console.log("🚀 Starting RL Pretraining Dojo (Terminal Mode)");
  
  const env = new MockRAGEnv();
  
  // Create Neural Network using TFJS
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 24, activation: 'relu', inputShape: [env.stateSpace] }));
  model.add(tf.layers.dense({ units: 24, activation: 'relu' }));
  model.add(tf.layers.dense({ units: env.actionSpace, activation: 'linear' })); // Q-Values
  
  model.compile({
    optimizer: tf.train.adam(0.005),
    loss: 'meanSquaredError'
  });

  const targetModel = tf.sequential();
  targetModel.add(tf.layers.dense({ units: 24, activation: 'relu', inputShape: [env.stateSpace] }));
  targetModel.add(tf.layers.dense({ units: 24, activation: 'relu' }));
  targetModel.add(tf.layers.dense({ units: env.actionSpace, activation: 'linear' }));
  targetModel.setWeights(model.getWeights());

  const memory = new ReplayBuffer();
  
  // Hyperparameters
  const EPISODES = 50; // Reduced for fast execution
  const BATCH_SIZE = 64;
  const GAMMA = 0.95;
  let epsilon = 1.0;
  const EPSILON_MIN = 0.05;
  const EPSILON_DECAY = 0.995;

  console.log(`Menjalankan simulasi selama ${EPISODES} episode...`);

  for (let e = 0; e < EPISODES; e++) {
    let state = env.reset();
    let totalReward = 0;
    let done = false;

    while (!done) {
        // Epsilon-Greedy Action Selection
        let action;
        if (Math.random() <= epsilon) {
            action = Math.floor(Math.random() * env.actionSpace);
        } else {
            tf.tidy(() => {
                const stateTensor = tf.tensor2d([state]);
                const qValues = model.predict(stateTensor) as tf.Tensor;
                action = qValues.argMax(-1).dataSync()[0];
            });
        }

        const { nextState, reward, done: isDone } = env.step(action, state);
        totalReward += reward;

        // Store experience
        memory.add({ state, action, reward, nextState, done: isDone });
        state = nextState;
        done = isDone;

        // Replay Memory & Learn
        if (memory.size() >= BATCH_SIZE) {
            const batch = memory.sample(BATCH_SIZE);
            let currentQsData: number[][] = [];

            tf.tidy(() => {
                const states = batch.map(b => b.state);
                const nextStates = batch.map(b => b.nextState);
                const actions = batch.map(b => b.action);
                const rewards = batch.map(b => b.reward);
                const dones = batch.map(b => b.done);

                currentQsData = (model.predict(tf.tensor2d(states)) as tf.Tensor).arraySync() as number[][];
                let nextQsData = (targetModel.predict(tf.tensor2d(nextStates)) as tf.Tensor).arraySync() as number[][];

                // Belman Equation Q(s, a) = r + gamma * max(Q(s', a'))
                for (let i = 0; i < BATCH_SIZE; i++) {
                    if (dones[i]) {
                        currentQsData[i][actions[i]] = rewards[i];
                    } else {
                        currentQsData[i][actions[i]] = rewards[i] + GAMMA * Math.max(...nextQsData[i]);
                    }
                }
            });

            // Apply gradients! (Must be outside tf.tidy because it is async)
            await model.fit(tf.tensor2d(batch.map(b => b.state)), tf.tensor2d(currentQsData), { epochs: 1, verbose: 0 });
        }
    }

    if (epsilon > EPSILON_MIN) epsilon *= EPSILON_DECAY;

    // Update target model periodically
    if (e % 10 === 0) {
        targetModel.setWeights(model.getWeights());
    }

    if (e % 50 === 0) {
        console.log(`Episode: ${e}/${EPISODES} | Reward: ${totalReward.toFixed(2)} | Epsilon: ${epsilon.toFixed(3)}`);
    }
  }

  // Save the model to a system folder reachable by Angular public/assets
  console.log("✅ Training selesai. Mengekspor model ke file .bin");
  const saveDir = path.resolve(process.cwd(), 'public', 'models', 'agentic_rl_v1');
  
  // ensure directory
  fs.mkdirSync(saveDir, { recursive: true });
  await model.save(`file://${saveDir}`);

  console.log(`💾 Model berhasil disimpan di: ${saveDir}`);
  console.log(`Hasil berupa weights.bin dan model.json siap dipanggil web worker/UI!`);
}

trainRL().catch(console.error);
