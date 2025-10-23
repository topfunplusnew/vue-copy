<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';

const route = useRoute();
const router = useRouter();

// Featured conference data - multiple conferences
const featuredConferences = reactive([
  {
    id: 1,
    logo: 'https://icml.cc/static/core/img/ICML-logo.png',
    conferenceName: 'ICML 2025',
    conferenceFullName: 'International Conference on Machine Learning',
    conferenceDate: 'July 21-27, 2025',
    location: {
      city: 'Vienna',
      country: 'Austria', 
      venue: 'Austria Center Vienna'
    },
    websites: {
      official: 'https://icml.cc',
      committee: 'https://icml.cc/Conferences/2025/Organizers',
      registration: 'https://icml.cc/Conferences/2025/Registration'
    },
    category: 'Machine Learning',
    submissionDeadline: 'February 1, 2025',
    notificationDate: 'April 25, 2025',
    description: 'The premier global event for machine learning research, bringing together researchers and practitioners from around the world.',
    topics: ['Deep Learning', 'Reinforcement Learning', 'Computer Vision', 'Natural Language Processing', 'Optimization'],
    tier: 'Tier 1',
    acceptanceRate: '22%',
    expectedAttendees: '4,500+',
    papers: [
      {
        id: 1,
        title: 'Attention Is All You Need',
        authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones'],
        institutions: ['Google Research', 'Google Brain', 'University of Toronto'],
        doi: '10.5555/3295222.3295349',
        abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
        keywords: ['Attention', 'Transformer', 'Neural Networks', 'Machine Translation'],
        graphicalAbstract: 'https://example.com/graphical-abstract-1.jpg',
        video: 'https://example.com/video-1.mp4',
        slides: 'https://example.com/slides-1.pdf',
        poster: 'https://example.com/poster-1.pdf',
        additionalInfo: 'https://example.com/additional-1.pdf'
      },
      {
        id: 2,
        title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
        authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
        institutions: ['Google AI Language'],
        doi: '10.18653/v1/N19-1423',
        abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
        keywords: ['BERT', 'Language Understanding', 'Pre-training', 'Transformers'],
        graphicalAbstract: 'https://example.com/graphical-abstract-2.jpg',
        video: 'https://example.com/video-2.mp4',
        slides: null,
        poster: 'https://example.com/poster-2.pdf',
        additionalInfo: null
      },
      {
        id: 3,
        title: 'ResNet: Deep Residual Learning for Image Recognition',
        authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
        institutions: ['Microsoft Research', 'Tsinghua University'],
        doi: '10.1109/CVPR.2016.90',
        abstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions.',
        keywords: ['ResNet', 'Deep Learning', 'Computer Vision', 'Image Recognition'],
        graphicalAbstract: 'https://example.com/graphical-abstract-3.jpg',
        video: null,
        slides: 'https://example.com/slides-3.pdf',
        poster: null,
        additionalInfo: 'https://example.com/additional-3.pdf'
      },
      {
        id: 4,
        title: 'GPT-3: Language Models are Few-Shot Learners',
        authors: ['Tom B. Brown', 'Benjamin Mann', 'Nick Ryder', 'Melanie Subbiah', 'Jared Kaplan'],
        institutions: ['OpenAI', 'Stanford University'],
        doi: '10.1145/3442188.3445922',
        abstract: 'We show that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches. We measure few-shot learning performance by evaluating GPT-3 on dozens of tasks.',
        keywords: ['GPT-3', 'Language Models', 'Few-Shot Learning', 'NLP'],
        graphicalAbstract: 'https://example.com/graphical-abstract-4.jpg',
        video: 'https://example.com/video-4.mp4',
        slides: 'https://example.com/slides-4.pdf',
        poster: 'https://example.com/poster-4.pdf',
        additionalInfo: 'https://example.com/additional-4.pdf'
      },
      {
        id: 5,
        title: 'Vision Transformer: An Image is Worth 16x16 Words',
        authors: ['Alexey Dosovitskiy', 'Lucas Beyer', 'Alexander Kolesnikov', 'Dirk Weissenborn'],
        institutions: ['Google Research', 'University of Oxford'],
        doi: '10.1007/978-3-030-87586-2_1',
        abstract: 'While the Transformer architecture has become the de-facto standard for natural language processing tasks, its applications to computer vision remain limited. In vision, attention is either applied in conjunction with convolutional networks, or used to replace certain components of convolutional networks while keeping their overall structure in place.',
        keywords: ['Vision Transformer', 'Computer Vision', 'Attention', 'Image Classification'],
        graphicalAbstract: 'https://example.com/graphical-abstract-5.jpg',
        video: 'https://example.com/video-5.mp4',
        slides: 'https://example.com/slides-5.pdf',
        poster: null,
        additionalInfo: 'https://example.com/additional-5.pdf'
      },
      {
        id: 6,
        title: 'DALL-E: Creating Images from Text',
        authors: ['Aditya Ramesh', 'Mikhail Pavlov', 'Gabriel Goh', 'Scott Gray'],
        institutions: ['OpenAI'],
        doi: '10.1145/3442188.3445922',
        abstract: 'We present DALL-E, a neural network that creates images from text captions for a wide range of concepts expressible in natural language. DALL-E is a 12-billion parameter version of GPT-3 trained to generate images from text descriptions.',
        keywords: ['DALL-E', 'Text-to-Image', 'Generative Models', 'Computer Vision'],
        graphicalAbstract: 'https://example.com/graphical-abstract-6.jpg',
        video: null,
        slides: 'https://example.com/slides-6.pdf',
        poster: 'https://example.com/poster-6.pdf',
        additionalInfo: null
      },
      {
        id: 7,
        title: 'CLIP: Learning Transferable Visual Representations from Natural Language Supervision',
        authors: ['Alec Radford', 'Jong Wook Kim', 'Chris Hallacy', 'Aditya Ramesh'],
        institutions: ['OpenAI'],
        doi: '10.1145/3442188.3445922',
        abstract: 'State-of-the-art computer vision systems are trained to predict a fixed set of predetermined object categories. This restricted form of supervision limits their generality and usability since additional labeled data is needed to specify any other visual concept.',
        keywords: ['CLIP', 'Contrastive Learning', 'Vision-Language', 'Transfer Learning'],
        graphicalAbstract: 'https://example.com/graphical-abstract-7.jpg',
        video: 'https://example.com/video-7.mp4',
        slides: 'https://example.com/slides-7.pdf',
        poster: 'https://example.com/poster-7.pdf',
        additionalInfo: 'https://example.com/additional-7.pdf'
      },
      {
        id: 8,
        title: 'AlphaFold: Protein Structure Prediction with Deep Learning',
        authors: ['John Jumper', 'Richard Evans', 'Alexander Pritzel', 'Tim Green'],
        institutions: ['DeepMind', 'University College London'],
        doi: '10.1038/s41586-021-03819-2',
        abstract: 'Proteins are essential to life, and understanding their structure can facilitate a mechanistic understanding of their function. Through an enormous experimental effort, the structures of around 100,000 unique proteins have been determined.',
        keywords: ['AlphaFold', 'Protein Structure', 'Deep Learning', 'Bioinformatics'],
        graphicalAbstract: 'https://example.com/graphical-abstract-8.jpg',
        video: 'https://example.com/video-8.mp4',
        slides: 'https://example.com/slides-8.pdf',
        poster: null,
        additionalInfo: 'https://example.com/additional-8.pdf'
      },
      {
        id: 9,
        title: 'Stable Diffusion: High-Resolution Image Synthesis with Latent Diffusion Models',
        authors: ['Robin Rombach', 'Andreas Blattmann', 'Dominik Lorenz', 'Patrick Esser'],
        institutions: ['Stability AI', 'LMU Munich'],
        doi: '10.1145/3528233.3530107',
        abstract: 'By decomposing the image formation process into a sequential application of denoising autoencoders, diffusion models achieve state-of-the-art synthesis results on image data and beyond. Furthermore, their formulation allows for a guiding mechanism to control the generation process without retraining.',
        keywords: ['Stable Diffusion', 'Diffusion Models', 'Image Generation', 'Latent Space'],
        graphicalAbstract: 'https://example.com/graphical-abstract-9.jpg',
        video: null,
        slides: 'https://example.com/slides-9.pdf',
        poster: 'https://example.com/poster-9.pdf',
        additionalInfo: 'https://example.com/additional-9.pdf'
      },
      {
        id: 10,
        title: 'ChatGPT: Optimizing Language Models for Dialogue',
        authors: ['Long Ouyang', 'Jeff Wu', 'Xu Jiang', 'Diogo Almeida'],
        institutions: ['OpenAI'],
        doi: '10.1145/3442188.3445922',
        abstract: 'We trained ChatGPT using Reinforcement Learning from Human Feedback (RLHF), using the same methods as InstructGPT, but with slight differences in the data collection setup. We trained an initial model using supervised fine-tuning.',
        keywords: ['ChatGPT', 'Dialogue Systems', 'RLHF', 'Language Models'],
        graphicalAbstract: 'https://example.com/graphical-abstract-10.jpg',
        video: 'https://example.com/video-10.mp4',
        slides: 'https://example.com/slides-10.pdf',
        poster: 'https://example.com/poster-10.pdf',
        additionalInfo: 'https://example.com/additional-10.pdf'
      }
    ]
  },
  {
    id: 2,
    logo: 'https://iclr.cc/static/core/img/ICLR-logo.svg',
    conferenceName: 'ICLR 2025',
    conferenceFullName: 'International Conference on Learning Representations',
    conferenceDate: 'May 7-11, 2025',
    location: {
      city: 'Singapore',
      country: 'Singapore',
      venue: 'Singapore EXPO'
    },
    websites: {
      official: 'https://iclr.cc',
      committee: 'https://iclr.cc/Conferences/2025/Organizers',
      registration: 'https://iclr.cc/Conferences/2025/Registration'
    },
    category: 'Deep Learning',
    submissionDeadline: 'October 1, 2024',
    notificationDate: 'January 15, 2025',
    description: 'A top-tier venue for research on learning representations, with a focus on deep learning and representation learning.',
    topics: ['Representation Learning', 'Deep Learning Theory', 'Generative Models', 'Transfer Learning'],
    tier: 'Tier 1',
    acceptanceRate: '19%',
    expectedAttendees: '3,200+',
    papers: [
      {
        id: 11,
        title: 'Generative Adversarial Networks',
        authors: ['Ian Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza', 'Bing Xu'],
        institutions: ['University of Montreal', 'McGill University'],
        doi: '10.1145/3422622',
        abstract: 'We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G.',
        keywords: ['GAN', 'Generative Models', 'Adversarial Training', 'Deep Learning'],
        graphicalAbstract: 'https://example.com/graphical-abstract-11.jpg',
        video: 'https://example.com/video-11.mp4',
        slides: 'https://example.com/slides-11.pdf',
        poster: 'https://example.com/poster-11.pdf',
        additionalInfo: null
      },
      {
        id: 12,
        title: 'Variational Autoencoders',
        authors: ['Diederik P. Kingma', 'Max Welling'],
        institutions: ['University of Amsterdam'],
        doi: '10.1145/3422622',
        abstract: 'How can we perform efficient inference and learning in directed probabilistic models, in the presence of continuous latent variables with intractable posterior distributions, and large datasets? We introduce a stochastic variational inference and learning algorithm that scales to large datasets and, under some mild differentiability conditions, even works in the intractable case.',
        keywords: ['VAE', 'Variational Inference', 'Generative Models', 'Autoencoders'],
        graphicalAbstract: 'https://example.com/graphical-abstract-12.jpg',
        video: null,
        slides: 'https://example.com/slides-12.pdf',
        poster: null,
        additionalInfo: 'https://example.com/additional-12.pdf'
      },
      {
        id: 13,
        title: 'Neural Ordinary Differential Equations',
        authors: ['Ricky T. Q. Chen', 'Yulia Rubanova', 'Jesse Bettencourt', 'David Duvenaud'],
        institutions: ['University of Toronto', 'Vector Institute'],
        doi: '10.1145/3327345.3327346',
        abstract: 'We introduce a new family of deep neural network models. Instead of specifying a discrete sequence of hidden layers, we parameterize the derivative of the hidden state using a neural network. The output of the network is computed using a black-box differential equation solver.',
        keywords: ['Neural ODEs', 'Continuous Depth', 'Differential Equations', 'Deep Learning'],
        graphicalAbstract: 'https://example.com/graphical-abstract-13.jpg',
        video: 'https://example.com/video-13.mp4',
        slides: 'https://example.com/slides-13.pdf',
        poster: 'https://example.com/poster-13.pdf',
        additionalInfo: 'https://example.com/additional-13.pdf'
      },
      {
        id: 14,
        title: 'Graph Neural Networks: A Review of Methods and Applications',
        authors: ['Zonghan Wu', 'Shirui Pan', 'Fengwen Chen', 'Guodong Long'],
        institutions: ['Monash University', 'University of Technology Sydney'],
        doi: '10.1145/3434184.3434184',
        abstract: 'Many underlying relationships among data in several areas of science and engineering, e.g., physical systems, molecular structures, biological networks, and natural language understanding, can be represented in terms of graphs.',
        keywords: ['Graph Neural Networks', 'Graph Learning', 'Deep Learning', 'Network Analysis'],
        graphicalAbstract: 'https://example.com/graphical-abstract-14.jpg',
        video: null,
        slides: 'https://example.com/slides-14.pdf',
        poster: 'https://example.com/poster-14.pdf',
        additionalInfo: null
      },
      {
        id: 15,
        title: 'Self-Attention Mechanisms in Neural Networks',
        authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit'],
        institutions: ['Google Research', 'Google Brain'],
        doi: '10.1145/3422622',
        abstract: 'The dominant approach for sequence modeling and transduction problems is based on recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism.',
        keywords: ['Self-Attention', 'Transformer', 'Sequence Modeling', 'Neural Networks'],
        graphicalAbstract: 'https://example.com/graphical-abstract-15.jpg',
        video: 'https://example.com/video-15.mp4',
        slides: 'https://example.com/slides-15.pdf',
        poster: null,
        additionalInfo: 'https://example.com/additional-15.pdf'
      },
      {
        id: 16,
        title: 'Meta-Learning: Learning to Learn',
        authors: ['Chelsea Finn', 'Pieter Abbeel', 'Sergey Levine'],
        institutions: ['Stanford University', 'UC Berkeley'],
        doi: '10.1145/3422622',
        abstract: 'The goal of meta-learning is to train a model on a variety of learning tasks, such that it can solve new learning tasks using only a small number of training samples. In this paper, we propose a model-agnostic meta-learning algorithm.',
        keywords: ['Meta-Learning', 'Few-Shot Learning', 'Transfer Learning', 'Deep Learning'],
        graphicalAbstract: 'https://example.com/graphical-abstract-16.jpg',
        video: null,
        slides: 'https://example.com/slides-16.pdf',
        poster: 'https://example.com/poster-16.pdf',
        additionalInfo: 'https://example.com/additional-16.pdf'
      },
      {
        id: 17,
        title: 'Federated Learning: Challenges, Methods, and Future Directions',
        authors: ['Qiang Yang', 'Yang Liu', 'Yong Cheng', 'Yan Kang'],
        institutions: ['Hong Kong University of Science and Technology', 'WeBank'],
        doi: '10.1145/3422622',
        abstract: 'Federated learning is a machine learning technique that trains an algorithm across multiple decentralized edge devices or servers holding local data samples, without exchanging them.',
        keywords: ['Federated Learning', 'Distributed Learning', 'Privacy', 'Edge Computing'],
        graphicalAbstract: 'https://example.com/graphical-abstract-17.jpg',
        video: 'https://example.com/video-17.mp4',
        slides: 'https://example.com/slides-17.pdf',
        poster: 'https://example.com/poster-17.pdf',
        additionalInfo: null
      },
      {
        id: 18,
        title: 'Contrastive Learning: A Survey',
        authors: ['Kaiming He', 'Haoqi Fan', 'Yuxin Wu', 'Saining Xie'],
        institutions: ['Facebook AI Research', 'Stanford University'],
        doi: '10.1145/3422622',
        abstract: 'Contrastive learning has become a key component of self-supervised learning approaches for computer vision. By learning to embed similar images nearby and dissimilar images far apart, contrastive learning has achieved state-of-the-art results.',
        keywords: ['Contrastive Learning', 'Self-Supervised Learning', 'Representation Learning', 'Computer Vision'],
        graphicalAbstract: 'https://example.com/graphical-abstract-18.jpg',
        video: 'https://example.com/video-18.mp4',
        slides: 'https://example.com/slides-18.pdf',
        poster: null,
        additionalInfo: 'https://example.com/additional-18.pdf'
      }
    ]
  },
  {
    id: 3,
    logo: 'https://aaai.org/wp-content/uploads/2020/09/AAAI-Logo.jpg',
    conferenceName: 'AAAI 2025',
    conferenceFullName: 'AAAI Conference on Artificial Intelligence',
    conferenceDate: 'February 25 - March 4, 2025',
    location: {
      city: 'Philadelphia',
      country: 'USA',
      venue: 'Pennsylvania Convention Center'
    },
    websites: {
      official: 'https://aaai.org',
      committee: 'https://aaai.org/Conferences/AAAI-25/organizers',
      registration: 'https://aaai.org/Conferences/AAAI-25/registration'
    },
    category: 'Artificial Intelligence',
    submissionDeadline: 'August 15, 2024',
    notificationDate: 'November 9, 2024',
    description: 'The premier conference in artificial intelligence, covering all aspects of AI research and applications.',
    topics: ['AI Theory', 'Machine Learning', 'Knowledge Representation', 'Robotics', 'Natural Language Processing'],
    tier: 'Tier 1',
    acceptanceRate: '20%',
    expectedAttendees: '5,000+',
    papers: [
      {
        id: 19,
        title: 'Deep Q-Network for Playing Atari Games',
        authors: ['Volodymyr Mnih', 'Koray Kavukcuoglu', 'David Silver', 'Alex Graves'],
        institutions: ['DeepMind', 'University of Toronto'],
        doi: '10.1038/nature14236',
        abstract: 'The theory of reinforcement learning provides a normative account, deeply rooted in psychological and neuroscientific perspectives on animal behaviour, of how agents may optimize their control of an environment. To use reinforcement learning successfully in situations approaching real-world complexity, however, agents are confronted with a difficult task: they must derive efficient representations of the environment from high-dimensional sensory inputs.',
        keywords: ['Reinforcement Learning', 'Deep Q-Network', 'Atari', 'Neural Networks'],
        graphicalAbstract: 'https://example.com/graphical-abstract-19.jpg',
        video: 'https://example.com/video-19.mp4',
        slides: 'https://example.com/slides-19.pdf',
        poster: 'https://example.com/poster-19.pdf',
        additionalInfo: 'https://example.com/additional-19.pdf'
      },
      {
        id: 20,
        title: 'AlphaGo: Mastering the Game of Go with Deep Neural Networks',
        authors: ['David Silver', 'Aja Huang', 'Chris J. Maddison', 'Arthur Guez'],
        institutions: ['DeepMind'],
        doi: '10.1038/nature16961',
        abstract: 'The game of Go has long been viewed as the most challenging of classic games for artificial intelligence owing to its enormous search space and the difficulty of evaluating board positions and moves.',
        keywords: ['AlphaGo', 'Game AI', 'Deep Learning', 'Monte Carlo Tree Search'],
        graphicalAbstract: 'https://example.com/graphical-abstract-20.jpg',
        video: 'https://example.com/video-20.mp4',
        slides: 'https://example.com/slides-20.pdf',
        poster: null,
        additionalInfo: 'https://example.com/additional-20.pdf'
      },
      {
        id: 21,
        title: 'Proximal Policy Optimization Algorithms',
        authors: ['John Schulman', 'Filipp Wolski', 'Prafulla Dhariwal', 'Alec Radford'],
        institutions: ['OpenAI', 'UC Berkeley'],
        doi: '10.1145/3422622',
        abstract: 'We propose a new family of policy gradient methods for reinforcement learning, which alternate between sampling data through interaction with the environment and optimizing a surrogate objective using stochastic gradient ascent.',
        keywords: ['PPO', 'Policy Gradient', 'Reinforcement Learning', 'Deep Learning'],
        graphicalAbstract: 'https://example.com/graphical-abstract-21.jpg',
        video: null,
        slides: 'https://example.com/slides-21.pdf',
        poster: 'https://example.com/poster-21.pdf',
        additionalInfo: null
      },
      {
        id: 22,
        title: 'Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning',
        authors: ['Tuomas Haarnoja', 'Aurick Zhou', 'Pieter Abbeel', 'Sergey Levine'],
        institutions: ['UC Berkeley', 'Google Research'],
        doi: '10.1145/3422622',
        abstract: 'Model-free deep reinforcement learning (RL) algorithms have been successfully applied to a range of challenging domains, but they tend to suffer from two major problems: very high sample complexity and brittle convergence properties.',
        keywords: ['SAC', 'Reinforcement Learning', 'Maximum Entropy', 'Deep Learning'],
        graphicalAbstract: 'https://example.com/graphical-abstract-22.jpg',
        video: 'https://example.com/video-22.mp4',
        slides: 'https://example.com/slides-22.pdf',
        poster: 'https://example.com/poster-22.pdf',
        additionalInfo: 'https://example.com/additional-22.pdf'
      },
      {
        id: 23,
        title: 'Multi-Agent Reinforcement Learning: A Selective Overview',
        authors: ['Lucian Busoniu', 'Robert Babuska', 'Bart De Schutter'],
        institutions: ['Technical University of Cluj-Napoca', 'Delft University of Technology'],
        doi: '10.1145/3422622',
        abstract: 'Multi-agent systems can be used to address problems in a variety of domains, including robotics, distributed control, telecommunications, and economics. The complexity of many tasks arising in these domains makes them difficult to solve with preprogrammed agent behaviors.',
        keywords: ['Multi-Agent RL', 'Reinforcement Learning', 'Distributed Systems', 'Game Theory'],
        graphicalAbstract: 'https://example.com/graphical-abstract-23.jpg',
        video: null,
        slides: 'https://example.com/slides-23.pdf',
        poster: null,
        additionalInfo: 'https://example.com/additional-23.pdf'
      },
      {
        id: 24,
        title: 'Hierarchical Reinforcement Learning: A Comprehensive Survey',
        authors: ['Ofir Nachum', 'Shixiang Gu', 'Honglak Lee', 'Sergey Levine'],
        institutions: ['Google Research', 'University of Michigan'],
        doi: '10.1145/3422622',
        abstract: 'Hierarchical reinforcement learning (HRL) is a promising approach to address the curse of dimensionality in reinforcement learning by decomposing complex tasks into simpler subtasks.',
        keywords: ['Hierarchical RL', 'Reinforcement Learning', 'Task Decomposition', 'Deep Learning'],
        graphicalAbstract: 'https://example.com/graphical-abstract-24.jpg',
        video: 'https://example.com/video-24.mp4',
        slides: 'https://example.com/slides-24.pdf',
        poster: 'https://example.com/poster-24.pdf',
        additionalInfo: null
      },
      {
        id: 25,
        title: 'Imitation Learning: A Survey of Learning Methods',
        authors: ['Yisong Yue', 'Hoang M. Le', 'Peter Carr', 'Patrick Lucey'],
        institutions: ['Carnegie Mellon University', 'University of Southern California'],
        doi: '10.1145/3422622',
        abstract: 'Imitation learning is a paradigm in machine learning where the objective is to learn to perform a task from expert demonstrations. It is particularly useful in scenarios where the reward signal is not available or is difficult to specify.',
        keywords: ['Imitation Learning', 'Behavioral Cloning', 'Inverse RL', 'Deep Learning'],
        graphicalAbstract: 'https://example.com/graphical-abstract-25.jpg',
        video: 'https://example.com/video-25.mp4',
        slides: 'https://example.com/slides-25.pdf',
        poster: 'https://example.com/poster-25.pdf',
        additionalInfo: 'https://example.com/additional-25.pdf'
      },
      {
        id: 26,
        title: 'Safe Reinforcement Learning: A Survey',
        authors: ['Garcia Fernandez', 'Fernando Fernandez', 'Javier Garcia'],
        institutions: ['University of Granada', 'University of Malaga'],
        doi: '10.1145/3422622',
        abstract: 'Reinforcement learning (RL) is a powerful paradigm for learning optimal policies through interaction with the environment. However, RL algorithms often require extensive exploration, which can lead to unsafe behavior.',
        keywords: ['Safe RL', 'Reinforcement Learning', 'Safety Constraints', 'Deep Learning'],
        graphicalAbstract: 'https://example.com/graphical-abstract-26.jpg',
        video: null,
        slides: 'https://example.com/slides-26.pdf',
        poster: null,
        additionalInfo: 'https://example.com/additional-26.pdf'
      }
    ]
  }
]);

// Current selected conference
const selectedConference = ref(featuredConferences[0]);

// Paper interface
interface Paper {
  id: number;
  title: string;
  authors: string[];
  institutions: string[];
  doi: string;
  abstract: string;
  keywords: string[];
  graphicalAbstract: string | null;
  video: string | null;
  slides: string | null;
  poster: string | null;
  additionalInfo: string | null;
}

// Paper search and modal state
const searchQuery = ref('');
const selectedPaper = ref<Paper | null>(null);
const showPaperModal = ref(false);
const activeTab = ref('details');

// Pagination for papers
const currentPage = ref(1);
const papersPerPage = ref(12);
const totalPages = computed(() => {
  return Math.ceil(filteredPapers.value.length / papersPerPage.value);
});

// Paginated papers
const paginatedPapers = computed(() => {
  const start = (currentPage.value - 1) * papersPerPage.value;
  const end = start + papersPerPage.value;
  return filteredPapers.value.slice(start, end);
});

// Reset pagination when search changes
watch(searchQuery, () => {
  currentPage.value = 1;
});

// Conference statistics
const conferenceStats = computed(() => ({
  totalConferences: featuredConferences.length,
  categories: [...new Set(featuredConferences.map(c => c.category))],
  avgAcceptanceRate: Math.round(
    featuredConferences.reduce((sum, c) => sum + parseInt(c.acceptanceRate), 0) / featuredConferences.length
  )
}));

// Filtered papers based on search query
const filteredPapers = computed(() => {
  if (!selectedConference.value?.papers) return [];
  
  if (!searchQuery.value.trim()) {
    return selectedConference.value.papers;
  }
  
  const query = searchQuery.value.toLowerCase();
  return selectedConference.value.papers.filter(paper => 
    paper.title.toLowerCase().includes(query) ||
    paper.authors.some(author => author.toLowerCase().includes(query)) ||
    paper.institutions.some(institution => institution.toLowerCase().includes(query)) ||
    paper.keywords.some(keyword => keyword.toLowerCase().includes(query))
  );
});

function selectConference(conference: any) {
  selectedConference.value = conference;
}

function registerInterest(conferenceId: number) {
  ElMessage.success('Interest registered! You will receive updates about this conference.');
}

function openPaperModal(paper: Paper) {
  selectedPaper.value = paper;
  showPaperModal.value = true;
  activeTab.value = 'details';
}

function closePaperModal() {
  showPaperModal.value = false;
  selectedPaper.value = null;
}

function switchTab(tab: string) {
  activeTab.value = tab;
}

function getAuthorAffiliations(authorIndex: number, paper: Paper): string {
  // Simple mapping: first author -> institution 1, second author -> institution 2, etc.
  // In a real application, this would be more complex based on actual author-institution relationships
  const institutionIndex = authorIndex % paper.institutions.length;
  return (institutionIndex + 1).toString();
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

// Get tier color
function getTierColor(tier: string) {
  switch (tier) {
    case 'Tier 1': return '#d97706';
    case 'Tier 2': return '#dc2626'; 
    case 'Tier 3': return '#7c3aed';
    default: return '#6b7280';
  }
}

</script>

<template>
    <div class="background-layer"></div>
      
    <div class="featured-events-page main">
      <commonHeader />
      
      <section class="main-content">
        <!-- Conference Selector -->
        <aside class="conference-selector">
          <div class="selector-header">
            <h2>Featured Conferences</h2>
            <div class="stats">
              <span class="stat-item">{{ conferenceStats.totalConferences }} Conferences</span>
              <span class="stat-item">{{ conferenceStats.categories.length }} Categories</span>
            </div>
          </div>
          <div class="conference-list">
            <div 
              v-for="conf in featuredConferences" 
              :key="conf.id"
              :class="['conference-card', { active: selectedConference.id === conf.id }]"
              @click="selectConference(conf)"
            >
              <div class="card-logo">
                <img :src="conf.logo" :alt="conf.conferenceName" />
              </div>
              <div class="card-info">
                <div class="card-name">{{ conf.conferenceName }}</div>
                <div class="card-category">{{ conf.category }}</div>
                <div class="card-date">{{ conf.conferenceDate }}</div>
                <!-- <div class="card-tier" :style="{ color: getTierColor(conf.tier) }">{{ conf.tier }}</div> -->
              </div>
            </div>
          </div>
        </aside>

        <!-- Conference Details -->
        <section class="conference-details">
          <header class="event-header">
            <div class="conference-header">
              <div class="logo">
                <img :src="selectedConference.logo" :alt="selectedConference.conferenceName" />
              </div>
              <div class="conference-info">
                <div class="conference-name">{{ selectedConference.conferenceName }}</div>
                <div class="conference-full-name">{{ selectedConference.conferenceFullName }}</div>
                <div class="conference-details">
                  <div class="detail-row">
                    <span class="detail-icon">📅</span>
                    <span class="detail-text">{{ selectedConference.conferenceDate }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-icon">📍</span>
                    <span class="detail-text">{{ selectedConference.location.city }}, {{ selectedConference.location.country }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-icon">🏢</span>
                    <span class="detail-text">{{ selectedConference.location.venue }}</span>
                  </div>
                 
                </div>
              </div>
            </div>

            <div class="conference-links">
              <a :href="selectedConference.websites.official" target="_blank" class="conf-link">
                <span class="link-icon">🌐</span>
                Official Website
              </a>
              <a :href="selectedConference.websites.committee" target="_blank" class="conf-link">
                <span class="link-icon">👥</span>
                Committee
              </a>
              <a :href="selectedConference.websites.registration" target="_blank" class="conf-link">
                <span class="link-icon">📝</span>
                Registration
              </a>
            </div>
            
            <!-- Conference Statistics & Info -->
            <!-- <div class="conference-stats">
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon">⭐</div>
                  <div class="stat-value">{{ selectedConference.tier }}</div>
                  <div class="stat-label">Conference Tier</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">📊</div>
                  <div class="stat-value">{{ selectedConference.acceptanceRate }}</div>
                  <div class="stat-label">Acceptance Rate</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">👥</div>
                  <div class="stat-value">{{ selectedConference.expectedAttendees }}</div>
                  <div class="stat-label">Expected Attendees</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">🏷️</div>
                  <div class="stat-value">{{ selectedConference.category }}</div>
                  <div class="stat-label">Research Area</div>
                </div>
              </div>
            </div> -->

            <!-- Conference Description -->
            <div class="conference-description">
              <h3>About This Conference</h3>
              <p>{{ selectedConference.description }}</p>
            </div>

            <!-- Research Topics -->
            <div class="research-topics">
              <h3>Key Research Topics</h3>
              <div class="topic-tags">
                <span v-for="topic in selectedConference.topics" :key="topic" class="topic-tag">
                  {{ topic }}
                </span>
              </div>
            </div>

            <!-- Important Dates -->
            <div class="important-dates">
              <h3>Important Dates</h3>
              <div class="dates-grid">
                <div class="date-item">
                  <div class="date-icon">📝</div>
                  <div class="date-info">
                    <div class="date-label">Submission Deadline</div>
                    <div class="date-value">{{ selectedConference.submissionDeadline }}</div>
                  </div>
                </div>
                <div class="date-item">
                  <div class="date-icon">📧</div>
                  <div class="date-info">
                    <div class="date-label">Notification Date</div>
                    <div class="date-value">{{ selectedConference.notificationDate }}</div>
                  </div>
                </div>
                <div class="date-item">
                  <div class="date-icon">🎯</div>
                  <div class="date-info">
                    <div class="date-label">Conference Dates</div>
                    <div class="date-value">{{ selectedConference.conferenceDate }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button @click="registerInterest(selectedConference.id)" class="interest-btn">
                <span class="btn-icon">💡</span>
                Add to Favourite
              </button>
              <a :href="selectedConference.websites.official" target="_blank" class="visit-btn">
                <span class="btn-icon">🔗</span>
                Visit Website
              </a>
              <a :href="selectedConference.websites.registration" target="_blank" class="register-btn">
                <span class="btn-icon">📝</span>
                Register Now
              </a>
            </div>
          </header>

          <!-- Papers Section -->
          <div class="papers-section">
            <div class="papers-header">
              <h3>Conference Papers</h3>
              <div class="search-container">
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Search papers by title, author, institution, or keywords..."
                  class="paper-search-input"
                />
                <span class="search-icon">🔍</span>
              </div>
            </div>
            
            <div class="papers-list">
              <div 
                v-for="paper in paginatedPapers" 
                :key="paper.id"
                class="paper-card"
                @click="openPaperModal(paper)"
              >
                <div class="paper-title">{{ paper.title }}</div>
                <div class="paper-authors">{{ paper.authors.join(', ') }}</div>
                <div class="paper-institutions">{{ paper.institutions.join(', ') }}</div>
                <div class="paper-keywords">
                  <span v-for="keyword in paper.keywords" :key="keyword" class="keyword-tag">
                    {{ keyword }}
                  </span>
                </div>
              </div>
              
              <div v-if="filteredPapers.length === 0" class="no-papers">
                <p>No papers found matching your search criteria.</p>
              </div>
            </div>
            
            <!-- Pagination -->
            <div v-if="totalPages > 1" class="pagination">
              <button 
                @click="prevPage" 
                :disabled="currentPage === 1"
                class="page-btn prev-btn"
              >
                ← Previous
              </button>
              
              <div class="page-numbers">
                <button 
                  v-for="page in Math.min(5, totalPages)" 
                  :key="page"
                  @click="goToPage(page)"
                  :class="['page-btn', { active: currentPage === page }]"
                >
                  {{ page }}
                </button>
                
                <span v-if="totalPages > 5" class="page-ellipsis">...</span>
                
                <button 
                  v-if="totalPages > 5"
                  @click="goToPage(totalPages)"
                  :class="['page-btn', { active: currentPage === totalPages }]"
                >
                  {{ totalPages }}
                </button>
              </div>
              
              <button 
                @click="nextPage" 
                :disabled="currentPage === totalPages"
                class="page-btn next-btn"
              >
                Next →
              </button>
            </div>
            
            <div class="papers-info">
              <p>Showing {{ (currentPage - 1) * papersPerPage + 1 }} - {{ Math.min(currentPage * papersPerPage, filteredPapers.length) }} of {{ filteredPapers.length }} papers</p>
            </div>
          </div>
        </section>
      </section>

      <!-- Paper Detail Modal -->
      <div v-if="showPaperModal" class="paper-modal-overlay" @click="closePaperModal">
        <div class="paper-modal" @click.stop>
          <div class="modal-header">
            <h2>{{ selectedPaper?.title }}</h2>
            <button class="close-btn" @click="closePaperModal">×</button>
          </div>
          
          <div class="modal-content">
            <div class="paper-info">
              <div class="info-section">
                <h4>Authors</h4>
                <div class="authors-list">
                  <span v-for="(author, index) in selectedPaper?.authors" :key="index" class="author-name">
                    {{ author }}<sup>{{ selectedPaper ? getAuthorAffiliations(index, selectedPaper) : '' }}</sup>{{ index < (selectedPaper?.authors.length || 0) - 1 ? ',' : '' }}
                  </span>
                </div>
              </div>
              <div class="info-section">
                <h4>Affiliations</h4>
                <div class="affiliations-list">
                  <div v-for="(institution, index) in selectedPaper?.institutions" :key="index" class="affiliation">
                    <sup>{{ index + 1 }}</sup>{{ institution }}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="tab-navigation">
              <button 
                :class="['tab-btn', { active: activeTab === 'details' }]"
                @click="switchTab('details')"
              >
                Details
              </button>
              <button 
                :class="['tab-btn', { active: activeTab === 'videos', disabled: !selectedPaper?.video }]"
                @click="selectedPaper?.video && switchTab('videos')"
                :disabled="!selectedPaper?.video"
              >
                Videos
              </button>
              <button 
                :class="['tab-btn', { active: activeTab === 'slides', disabled: !selectedPaper?.slides }]"
                @click="selectedPaper?.slides && switchTab('slides')"
                :disabled="!selectedPaper?.slides"
              >
                Slides
              </button>
              <button 
                :class="['tab-btn', { active: activeTab === 'poster', disabled: !selectedPaper?.poster }]"
                @click="selectedPaper?.poster && switchTab('poster')"
                :disabled="!selectedPaper?.poster"
              >
                Poster
              </button>
              <button 
                :class="['tab-btn', { active: activeTab === 'additional', disabled: !selectedPaper?.additionalInfo }]"
                @click="selectedPaper?.additionalInfo && switchTab('additional')"
                :disabled="!selectedPaper?.additionalInfo"
              >
                Additional Info
              </button>
            </div>
            
            <div class="tab-content">
              <div v-if="activeTab === 'details'" class="details-content">
                <div class="detail-item">
                  <h5>DOI</h5>
                  <p>{{ selectedPaper?.doi }}</p>
                </div>
                <div class="detail-item">
                  <h5>Abstract</h5>
                  <p>{{ selectedPaper?.abstract }}</p>
                </div>
                <div class="detail-item">
                  <h5>Graphical Abstract</h5>
                  <img v-if="selectedPaper?.graphicalAbstract" :src="selectedPaper.graphicalAbstract" alt="Graphical Abstract" class="graphical-abstract" />
                </div>
                <div class="detail-item">
                  <h5>Keywords</h5>
                  <div class="keywords-list">
                    <span v-for="keyword in selectedPaper?.keywords" :key="keyword" class="keyword-tag">
                      {{ keyword }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div v-if="activeTab === 'videos'" class="videos-content">
                <video v-if="selectedPaper?.video" :src="selectedPaper.video" controls class="paper-video">
                  Your browser does not support the video tag.
                </video>
              </div>
              
              <div v-if="activeTab === 'slides'" class="slides-content">
                <iframe v-if="selectedPaper?.slides" :src="selectedPaper.slides" class="slides-iframe"></iframe>
              </div>
              
              <div v-if="activeTab === 'poster'" class="poster-content">
                <img v-if="selectedPaper?.poster" :src="selectedPaper.poster" alt="Poster" class="poster-image" />
              </div>
              
              <div v-if="activeTab === 'additional'" class="additional-content">
                <iframe v-if="selectedPaper?.additionalInfo" :src="selectedPaper.additionalInfo" class="additional-iframe"></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>