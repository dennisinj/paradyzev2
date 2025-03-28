import React, { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Upload, RefreshCw, ChevronDown, ChevronUp, Settings, ExternalLink, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import axios from 'axios';
import './CreateAgent.css'; // Import CSS for custom scrollbar
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SparkleButton } from '../../components/ui/sparkle-button';

// Agent and Message interfaces removed

// Message interface removed

interface AgentConfig {
  name: string;
  description: string;
  ticker: string;
  personality: string;
  picture: string;
  topics?: string[];
  clients: {
    discord: boolean;
    telegram: boolean;
    twitter: boolean;
    slack: boolean;
    direct: boolean;
    simsai: boolean;
  };
  templateName: string;
  enableTwitter: boolean;
  memorySettings: {
    enableRagKnowledge: boolean;
    enableLoreMemory: boolean;
    enableDescriptionMemory: boolean;
    enableDocumentsMemory: boolean;
  };
  plugins: string[];
  initialTokenSupply?: number;
  creatorShare?: number;
  liquidityShare?: number;
}

// X Logo SVG Component
const XLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 1200 1227">
    <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z"/>
  </svg>
);

// Discord Logo SVG Component
const DiscordLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 256 199" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
    <path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z"/>
  </svg>
);

const CreateAgent: React.FC = () => {
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    ticker: '',
    personality: '',
    picture: 'https://source.unsplash.com/random/300x300/?robot,ai',
    topics: [],
    clients: {
      discord: false,
      telegram: false,
      twitter: false,
      slack: false,
      direct: true,
      simsai: false
    },
    templateName: 'trading-agent',
    enableTwitter: false,
    memorySettings: {
      enableRagKnowledge: false,
      enableLoreMemory: true,
      enableDescriptionMemory: true,
      enableDocumentsMemory: false,
    },
    plugins: [],
    initialTokenSupply: 1000000,
    creatorShare: 20,
    liquidityShare: 80
  });
  
  // Removed chat-related state
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'personality', 'examples', 'clients'
  
  // Step-based navigation
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4; // Total number of steps in the wizard
  
  // State for validation errors
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Validation function
  const validateCurrentStep = (): boolean => {
    setValidationError(null);
    
    switch(currentStep) {
      case 1: // Basic Information
        if (!agentConfig.name.trim()) {
          setValidationError('Agent name is required');
          return false;
        }
        if (!agentConfig.description.trim()) {
          setValidationError('Description is required');
          return false;
        }
        // At least one client integration should be enabled
        const hasEnabledClient = Object.values(agentConfig.clients).some(enabled => enabled);
        if (!hasEnabledClient) {
          setValidationError('At least one client integration is required');
          return false;
        }
        return true;
        
      case 2: // Personality & Knowledge
        if (!agentConfig.personality.trim()) {
          setValidationError('Personality description is required');
          return false;
        }
        return true;
        
      case 3: // Tokenize - Skip validation as this step is marked as "Coming Soon"
        // Automatically pass validation for step 3
        return true;
        
      case 4: // Review & Create
        // Since tokenization is not available, we only need to validate that
        // both step 1 and step 2 are valid
        return validateSpecificStep(1) && validateSpecificStep(2);
      
      default:
        return true;
    }
  };
  
  // Helper function to validate a specific step
  const validateSpecificStep = (step: number): boolean => {
    const currentStepBackup = currentStep;
    setCurrentStep(step);
    const isValid = validateCurrentStep();
    setCurrentStep(currentStepBackup);
    return isValid;
  };
  
  // Navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps && validateCurrentStep()) {
      // Skip step 3 (Tokenize) since it's marked as "Coming Soon"
      if (currentStep === 2) {
        setCurrentStep(4);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      // Skip step 3 (Tokenize) when going back from step 4
      if (currentStep === 4) {
        setCurrentStep(2);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };
  
  const goToStep = (step: number) => {
    // Prevent navigation to step 3 (Tokenize)
    if (step === 3) {
      return;
    }
    
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };
  
  // Get step title
  const getStepTitle = (step: number): string => {
    switch (step) {
      case 1:
        return 'Basic Information';
      case 2:
        return 'Personality & Knowledge';
      case 3:
        return 'Tokenize';
      case 4:
        return 'Review & Create';
      default:
        return 'Agent Creation';
    }
  };
  const [customPluginId, setCustomPluginId] = useState('');

  // Available models
  const availableModels = [
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'openai' },
    { value: 'gpt-4', label: 'GPT-4', provider: 'openai' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'openai' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'anthropic' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', provider: 'anthropic' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'anthropic' }
  ];
  
  // Available model providers
  const modelProviders = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' }
  ];

  // Removed chat-related useEffect

  // Removed chat-related useEffect

  // Dummy fetchAgents function to replace the removed one
  const fetchAgents = () => {
    console.log('Agents would be fetched here in the original implementation');
    // This is just a placeholder - in the wizard we don't need to actually fetch agents
  };
  
  // Removed more chat-related code

  // Removed handleSendMessage function

  // Removed handleKeyDown function

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAgentConfig({
          ...agentConfig,
          picture: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateRandomAgent = () => {
    const randomIndex = Math.floor(Math.random() * 5);
    
    // Sample names
    const names = [
      'AlphaTrader',
      'QuantumFinance',
      'MarketOracle',
      'TradingTitan',
      'FinanceForge'
    ];
    
    // Sample tickers
    const tickers = [
      'ALPH',
      'QFIN',
      'ORCL',
      'TITN',
      'FORG'
    ];
    
    // Sample descriptions
    const descriptions = [
      'A trading agent specializing in cryptocurrency analysis and trading strategies',
      'A quantitative finance specialist focused on stock market analysis',
      'An oracle for market predictions and trading insights',
      'A powerful trading assistant for all financial markets',
      'A comprehensive financial analysis and trading strategy agent'
    ];
    
    // Sample personalities
    const personalities = [
      'Analytical and data-driven with a focus on technical analysis. Provides clear entry and exit points for trades. Risk-conscious but willing to take calculated risks when the reward potential is high. Specializes in cryptocurrency markets with emphasis on Bitcoin and major altcoins.',
      'Conservative and methodical with emphasis on fundamental analysis. Prefers long-term investment strategies over short-term trading. Focuses on value stocks with strong fundamentals and dividend history. Provides thorough market analysis with economic context.',
      'Balanced approach combining technical and fundamental analysis. Adapts strategy based on market conditions. Specializes in forex markets with particular expertise in major currency pairs. Emphasizes proper risk management and position sizing.',
      'Macro-focused with strong emphasis on intermarket relationships. Specializes in commodity trading with expertise in seasonal patterns. Considers geopolitical factors in analysis. Provides both short and medium-term trading opportunities.',
      'Mathematical and probability-based approach to markets. Specializes in options trading strategies. Focuses on volatility analysis and risk/reward optimization. Provides detailed explanations of complex trading concepts.'
    ];
    
    // Generate random tokenization values
    const initialTokenSupply = Math.floor(Math.random() * 9000000) + 1000000; // Random between 1M and 10M
    const creatorShare = Math.floor(Math.random() * 30) + 10; // Random between 10% and 40%
    const liquidityShare = 100 - creatorShare; // Ensure total is 100%
    
    // Set the agent config
    setAgentConfig({
      ...agentConfig,
      name: names[randomIndex],
      ticker: tickers[randomIndex],
      description: descriptions[randomIndex],
      personality: personalities[randomIndex],
      picture: `https://source.unsplash.com/random/300x300/?robot,ai&${Date.now()}`,
      clients: {
        ...agentConfig.clients,
        direct: true, // Always enabled
        twitter: Math.random() > 0.5,
        discord: Math.random() > 0.5
      },
      initialTokenSupply,
      creatorShare,
      liquidityShare
    });
  };
  
  const createAgent = async () => {
    setIsCreating(true);
    setCreationError(null);
    
    try {
      // Transform the clients object into an array format for Eliza
      const activeClients = [];
      
      // Direct chat is always enabled
      activeClients.push("direct");
      
      // Add other clients if enabled
      if (agentConfig.clients.discord) activeClients.push("discord");
      if (agentConfig.clients.twitter) activeClients.push("twitter");
      if (agentConfig.clients.telegram) activeClients.push("telegram");
      
      // Prepare the Eliza character file format
      const elizaCharacterConfig = {
        name: agentConfig.name,
        modelProvider: 'openrouter', // Fixed model provider
        clients: activeClients,
        plugins: agentConfig.plugins,
        settings: {
          ragKnowledge: agentConfig.memorySettings.enableRagKnowledge,
          secrets: {},
          model: 'openai/gpt-4o-mini' // Fixed model
        },
        // Add system prompt based on personality
        system: `You are ${agentConfig.name}. ${agentConfig.description}\n\nPersonality: ${agentConfig.personality}`,
        // Parse personality into structured components
        ...parsePersonalityToBio(agentConfig.personality),
        // Add character bio
        bio: [
          agentConfig.description,
          ...agentConfig.personality.split('\n').filter(line => line.trim())
        ],
        // Required message examples
        messageExamples: [[
          {
            user: "user1",
            content: { text: "What's your trading strategy?" },
            response: `As ${agentConfig.name}, I ${agentConfig.description}`
          }
        ]],
        // Required post examples
        postExamples: [
          `${agentConfig.name} analyzing market trends: ${agentConfig.description}`,
          `Trading update from ${agentConfig.name}: Market analysis based on ${agentConfig.personality.split('\n')[0] || 'technical analysis'}`
        ],
        style: {
          all: [],
          chat: agentConfig.personality.split('\n')
            .filter(line => line.trim())
            .map(line => line.trim()),
          post: []
        },
        // Add memory settings
        memorySettings: {
          enableRagKnowledge: agentConfig.memorySettings.enableRagKnowledge,
          enableLoreMemory: agentConfig.memorySettings.enableLoreMemory,
          enableDescriptionMemory: agentConfig.memorySettings.enableDescriptionMemory,
          enableDocumentsMemory: agentConfig.memorySettings.enableDocumentsMemory
        }
      };
      
      // Send the request in the format expected by the backend API
      const response = await axios.post('/api/agents', {
        templateName: agentConfig.templateName,
        name: agentConfig.name,
        description: agentConfig.description,
        character: elizaCharacterConfig,
        // Tokenization is coming soon, so we'll send placeholder values for now
        tokenization: {
          enabled: false,
          initialSupply: 1000000,
          distribution: {
            creator: 20,
            liquidityPool: 80
          }
        }
      });
      
      console.log('Agent created:', response.data);
      
      // Refresh the agents list
      fetchAgents();
      
      // Reset form or redirect
      // router.push('/agents');
      
    } catch (error) {
      console.error('Error creating agent:', error);
      setCreationError('Failed to create agent. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
  
  // Helper function to parse personality text into bio elements
  const parsePersonalityToBio = (personality: string) => {
    if (!personality) {
      // Return default values for required fields if no personality is provided
      return {
        lore: ["A trading agent focused on market analysis"],
        topics: ["trading", "market analysis", "investment strategies"],
        adjectives: ["analytical", "data-driven", "strategic"]
      };
    }
    
    // Split by periods and filter out empty strings
    const sentences = personality.split('.').filter(s => s.trim().length > 0);
    
    // Extract potential topics (more comprehensive implementation)
    const topicsKeywords = [
      'specializes in', 'expertise in', 'focus on', 'knowledge of', 'skilled in',
      'specializing in', 'expert in', 'focuses on', 'familiar with', 'proficient in',
      'trading', 'market', 'analysis', 'strategy', 'investment', 'risk', 'technical',
      'fundamental', 'cryptocurrency', 'forex', 'stocks', 'options', 'commodities'
    ];
    
    const topics: string[] = [];
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      for (const keyword of topicsKeywords) {
        if (lowerSentence.includes(keyword)) {
          // Extract the topic phrase
          const topicPhrase = sentence.trim();
          
          // Only add if not already included
          if (!topics.includes(topicPhrase)) {
            topics.push(topicPhrase);
          }
          break;
        }
      }
    });
    
    // If no topics were found, add default trading topics
    if (topics.length === 0) {
      topics.push("trading", "market analysis", "investment strategies");
    }
    
    // Extract potential traits/adjectives
    const adjectiveKeywords = [
      'is', 'approach is', 'style is', 'personality is', 'character is',
      'analytical', 'conservative', 'aggressive', 'balanced', 'methodical',
      'cautious', 'risk-averse', 'risk-taking', 'data-driven', 'intuitive',
      'technical', 'fundamental', 'quantitative', 'qualitative'
    ];
    
    const adjectives: string[] = [];
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      for (const keyword of adjectiveKeywords) {
        if (lowerSentence.includes(keyword)) {
          const adjectivePhrase = sentence.trim();
          
          // Only add if not already included
          if (!adjectives.includes(adjectivePhrase)) {
            adjectives.push(adjectivePhrase);
          }
          break;
        }
      }
    });
    
    // If no adjectives were found, add default trading-related adjectives
    if (adjectives.length === 0) {
      adjectives.push("analytical", "data-driven", "strategic");
    }
    
    // Remaining sentences become lore
    const lore = sentences
      .filter(sentence => {
        const lowerSentence = sentence.toLowerCase();
        
        // Check if sentence contains any topic or adjective keyword
        const isTopicSentence = topicsKeywords.some(keyword => 
          lowerSentence.includes(keyword.toLowerCase())
        );
        
        const isAdjectiveSentence = adjectiveKeywords.some(keyword => 
          lowerSentence.includes(keyword.toLowerCase())
        );
        
        return !isTopicSentence && !isAdjectiveSentence;
      })
      .map(s => s.trim());
    
    // If no lore was extracted, add a default lore entry
    if (lore.length === 0) {
      lore.push(`A trading agent specializing in market analysis and strategic investment decisions`);
    }
    
    return {
      lore,
      topics,
      adjectives
    };
  };

  return (
    <div className="min-h-screen text-white p-4 md:p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Create Your Trading Agent</h1>
      
      {/* Step Wizard Navigation */}
      <div className="mb-12">
        <div className="step-wizard">
          {/* Step Progress Bar */}
          <div className="step-progress">
            {/* Background line and progress bar are added via CSS ::before */}
            <motion.div 
              className="step-progress-bar" 
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ width: `${Math.max(0, ((currentStep - 1) / (totalSteps - 1)) * 100)}%` }}
            ></motion.div>
            
            {/* Step circles */}
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;
              const isTokenizeStep = stepNumber === 3;
              
              return (
                <motion.div 
                  key={stepNumber} 
                  className="step-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <motion.div 
                    className={`step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isTokenizeStep ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => isTokenizeStep ? null : goToStep(stepNumber)}
                    whileHover={{ scale: isTokenizeStep ? 1 : 1.05 }}
                    whileTap={{ scale: isTokenizeStep ? 1 : 0.95 }}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <span className="step-number" style={{ color: 'rgba(80, 80, 80, 0.9)', fontWeight: 'bold' }}>{stepNumber}</span>
                      </motion.div>
                    ) : (
                      <span className="step-number" style={{ color: isActive ? '#D4C6A1' : 'rgba(255, 255, 255, 0.7)' }}>{stepNumber}</span>
                    )}
                  </motion.div>
                  <motion.div 
                    className={`step-label ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isTokenizeStep ? 'opacity-50' : ''}`}
                    animate={{ 
                      color: isActive ? "#D4C6A1" : isCompleted ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.5)",
                      y: isActive ? -2 : 0
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {isTokenizeStep ? (
                      <div className="flex items-center">
                        {getStepTitle(stepNumber)} <span className="ml-2 text-xs bg-black/30 px-2 py-0.5 rounded text-[#D4C6A1]/80">Coming Soon</span>
                      </div>
                    ) : (
                      getStepTitle(stepNumber)
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        {/* Agent Preview Card - Wider and more modern */}
        <GlassCard className="w-full mb-8" noHoverEffect={true}>
          <GlassCardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Agent Preview</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAdvancedMode(!advancedMode)}
                  className="flex items-center gap-2 text-sm bg-black/30 hover:bg-black/50 text-white/70 hover:text-white px-3 py-2 rounded-lg border border-white/10 transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  {advancedMode ? 'Simple Mode' : 'Advanced Mode'}
                </button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                  onClick={generateRandomAgent}
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate Random
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Agent Image Column - Only visible on first step */}
              <div className={`flex flex-col items-center ${currentStep !== 1 ? 'hidden' : ''}`}>
                <div className="relative w-32 h-32 mb-3 overflow-hidden rounded-2xl shadow-lg">
                  <img 
                    src={agentConfig.picture} 
                    alt="Agent" 
                    className="w-full h-full object-cover border-2 border-[#D4C6A1]/30"
                  />
                  <label className="absolute bottom-2 right-2 bg-[#D4C6A1]/20 hover:bg-[#D4C6A1]/30 text-[#D4C6A1] border border-[#D4C6A1]/30 rounded-full p-2 cursor-pointer transition-all duration-200">
                    <Upload className="h-4 w-4" />
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                  </label>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{agentConfig.name || 'Agent Name'}</h3>
                  {agentConfig.ticker && <p className="text-white/70 text-sm">{agentConfig.ticker}</p>}
                </div>
              </div>
              
              {/* Agent Details Column - Wider and more modern */}
              <div className="flex-1">
                {/* Step Title */}
                <div className="mb-4 border-b border-white/10 pb-2">
                  <h2 className="text-xl font-semibold">
                    {currentStep === 1 && "Step 1: Basic Information"}
                    {currentStep === 2 && "Step 2: Personality & Knowledge"}
                    {currentStep === 3 && "Step 3: Tokenize"}
                    {currentStep === 4 && "Step 4: Review & Create"}
                  </h2>
                  <p className="text-white/60 text-sm mt-1">
                    {currentStep === 1 && "Set up the basic details and integrations for your trading agent"}
                    {currentStep === 2 && "Define your agent's personality and knowledge areas"}
                    {currentStep === 3 && "Configure your agent's ticker symbol and tokenization settings"}
                    {currentStep === 4 && "Review your agent's configuration and create it"}
                  </p>
                </div>
                {/* Show different fields based on current step */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Name</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-3 pr-10 focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50 transition-all duration-200"
                          placeholder="e.g. AlphaTrader"
                          value={agentConfig.name}
                          onChange={(e) => setAgentConfig({...agentConfig, name: e.target.value})}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <SparkleButton 
                            onSubmit={(value) => setAgentConfig({...agentConfig, name: value})} 
                            placeholder="Suggest a name for my trading agent..."
                            systemPrompt="You are a naming expert who helps users find creative, memorable names for AI trading agents. Keep names short, catchy, and relevant to trading/finance."
                            streamingEnabled={true}
                            apiEndpoint="http://localhost:3002/api/proxy/ai-chat"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Description</label>
                      <div className="relative">
                        <textarea 
                          className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-3 pr-10 focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50 resize-none transition-all duration-200"
                          rows={3}
                          placeholder="e.g. A trading agent specializing in cryptocurrency analysis and trading strategies"
                          value={agentConfig.description}
                          onChange={(e) => setAgentConfig({...agentConfig, description: e.target.value})}
                        />
                        <div className="absolute right-3 top-6">
                          <SparkleButton 
                            onSubmit={(value) => setAgentConfig({...agentConfig, description: value})} 
                            placeholder="Write a description for my trading agent..."
                            systemPrompt="You are a professional AI copywriter who specializes in writing concise, compelling descriptions for trading agents. Focus on highlighting the agent's value proposition in 1-2 sentences."
                            streamingEnabled={true}
                            apiEndpoint="http://localhost:3002/api/proxy/ai-chat"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Client Integrations</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-black/10 p-3 rounded-lg">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="enableDiscord"
                            className="mr-2"
                            checked={agentConfig.clients.discord}
                            onChange={(e) => setAgentConfig({
                              ...agentConfig, 
                              clients: {
                                ...agentConfig.clients,
                                discord: e.target.checked
                              }
                            })}
                          />
                          <label htmlFor="enableDiscord" className="text-white/90 text-sm flex items-center">
                            <DiscordLogo className="w-4 h-4 mr-2 text-white/90" /> Discord
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="enableTwitter"
                            className="mr-2"
                            checked={agentConfig.clients.twitter}
                            onChange={(e) => {
                              setAgentConfig({
                                ...agentConfig, 
                                clients: {
                                  ...agentConfig.clients,
                                  twitter: e.target.checked
                                },
                                enableTwitter: e.target.checked
                              });
                            }}
                          />
                          <label htmlFor="enableTwitter" className="text-white/90 text-sm flex items-center">
                            <XLogo className="w-4 h-4 mr-2 text-white/90" /> Twitter/X
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="enableTelegram"
                            className="mr-2"
                            checked={agentConfig.clients.telegram}
                            onChange={(e) => setAgentConfig({
                              ...agentConfig, 
                              clients: {
                                ...agentConfig.clients,
                                telegram: e.target.checked
                              }
                            })}
                          />
                          <label htmlFor="enableTelegram" className="text-white/90 text-sm">Telegram</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="enableSlack"
                            className="mr-2"
                            checked={agentConfig.clients.slack}
                            onChange={(e) => setAgentConfig({
                              ...agentConfig, 
                              clients: {
                                ...agentConfig.clients,
                                slack: e.target.checked
                              }
                            })}
                          />
                          <label htmlFor="enableSlack" className="text-white/90 text-sm">Slack</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="enableDirect"
                            className="mr-2"
                            checked={agentConfig.clients.direct}
                            onChange={(e) => setAgentConfig({
                              ...agentConfig, 
                              clients: {
                                ...agentConfig.clients,
                                direct: e.target.checked
                              }
                            })}
                          />
                          <label htmlFor="enableDirect" className="text-white/90 text-sm">Direct Chat</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="enableSimsAI"
                            className="mr-2"
                            checked={agentConfig.clients.simsai}
                            onChange={(e) => setAgentConfig({
                              ...agentConfig, 
                              clients: {
                                ...agentConfig.clients,
                                simsai: e.target.checked
                              }
                            })}
                          />
                          <label htmlFor="enableSimsAI" className="text-white/90 text-sm">SimsAI</label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 2: Personality & Knowledge - Only visible in step 2 */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Personality</label>
                      <div className="relative">
                        <textarea 
                          className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-3 pr-10 focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50 resize-none transition-all duration-200"
                          rows={4}
                          placeholder="Describe your agent's trading personality and strategy in detail. Include their approach to risk, preferred markets, analysis style, and any specialized knowledge."
                          value={agentConfig.personality}
                          onChange={(e) => setAgentConfig({...agentConfig, personality: e.target.value})}
                        />
                        <div className="absolute right-3 top-6">
                          <SparkleButton 
                            onSubmit={(value) => setAgentConfig({...agentConfig, personality: value})} 
                            placeholder="Create a personality for my trading agent..."
                            apiEndpoint="http://localhost:3002/api/proxy/ai-chat"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Memory Settings</label>
                        <div className="space-y-2 bg-black/10 p-3 rounded-lg">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="enableRagKnowledge"
                              className="mr-2"
                              checked={agentConfig.memorySettings.enableRagKnowledge}
                              onChange={(e) => setAgentConfig({
                                ...agentConfig,
                                memorySettings: {
                                  ...agentConfig.memorySettings,
                                  enableRagKnowledge: e.target.checked
                                }
                              })}
                            />
                            <label htmlFor="enableRagKnowledge" className="text-white/90 text-sm">Enable RAG Knowledge</label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="enableLoreMemory"
                              className="mr-2"
                              checked={agentConfig.memorySettings.enableLoreMemory}
                              onChange={(e) => setAgentConfig({
                                ...agentConfig,
                                memorySettings: {
                                  ...agentConfig.memorySettings,
                                  enableLoreMemory: e.target.checked
                                }
                              })}
                            />
                            <label htmlFor="enableLoreMemory" className="text-white/90 text-sm">Enable Lore Memory</label>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Topics of Expertise</label>
                        <div className="relative">
                          <textarea 
                            className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-3 pr-10 focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50 resize-none transition-all duration-200"
                            rows={4}
                            placeholder="Enter topics your agent is knowledgeable about, one per line (e.g., Technical Analysis, Cryptocurrency, Risk Management)"
                            value={agentConfig.topics?.join('\n') || ''}
                            onChange={(e) => {
                              const topics = e.target.value.split('\n').filter(t => t.trim() !== '');
                              setAgentConfig({...agentConfig, topics});
                            }}
                          />
                          <div className="absolute right-3 top-6">
                            <SparkleButton 
                              onSubmit={(value) => {
                                const topics = value.split(',').map(t => t.trim()).filter(t => t !== '');
                                setAgentConfig({...agentConfig, topics});
                              }} 
                              placeholder="Suggest expertise topics for my trading agent..."
                              apiEndpoint="http://localhost:3002/api/proxy/ai-chat"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 3: Tokenize - Only visible in step 3 */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="bg-black/10 p-8 rounded-lg flex flex-col items-center justify-center min-h-[300px]">
                      <div className="bg-[#D4C6A1]/20 backdrop-blur-sm px-8 py-3 rounded-full border border-[#D4C6A1]/30 mb-6">
                        <span className="text-[#D4C6A1] uppercase tracking-wider text-sm font-medium">Coming Soon</span>
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-4">Agent Tokenization</h3>
                      <p className="text-white/70 text-center max-w-md mb-6">
                        Agent tokenization will be available in a future update. You'll be able to create tokens for your agents and set distribution parameters.
                      </p>
                      <div className="flex gap-3">
                        <button 
                          onClick={prevStep}
                          className="px-5 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
                        >
                          Go Back
                        </button>
                        <button 
                          onClick={() => setCurrentStep(4)}
                          className="px-5 py-2.5 rounded-lg bg-[#D4C6A1]/80 text-black hover:bg-[#D4C6A1] transition-all duration-200"
                        >
                          Skip to Review
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 4: Review & Create - Only visible in step 4 */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="bg-black/10 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">Agent Configuration Summary</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-white/70 text-sm font-semibold mb-2">Basic Information</h4>
                          <ul className="space-y-1 text-sm">
                            <li><span className="text-white/50">Name:</span> {agentConfig.name || 'Not set'}</li>
                            <li><span className="text-white/50">Ticker:</span> {agentConfig.ticker || 'Not set'}</li>
                            <li><span className="text-white/50">Description:</span> {agentConfig.description ? `${agentConfig.description.substring(0, 30)}${agentConfig.description.length > 30 ? '...' : ''}` : 'Not set'}</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-white/70 text-sm font-semibold mb-2">Integrations</h4>
                          <ul className="space-y-1 text-sm">
                            <li>
                              <span className="text-white/50">Clients:</span> {
                                Object.entries(agentConfig.clients)
                                  .filter(([_, enabled]) => enabled)
                                  .map(([client]) => client)
                                  .join(', ') || 'None'
                              }
                            </li>
                            <li>
                              <span className="text-white/50">Plugins:</span> {
                                agentConfig.plugins.length > 0 
                                  ? agentConfig.plugins.join(', ')
                                  : 'None'
                              }
                            </li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-white/70 text-sm font-semibold mb-2">Tokenization</h4>
                          <div className="bg-black/20 p-2 rounded">
                            <div className="flex items-center">
                              <span className="text-[#D4C6A1]/90 text-xs">COMING SOON</span>
                            </div>
                            <p className="text-white/50 text-xs mt-1">Agent tokenization will be available in a future update</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-white/70 text-sm font-semibold mb-2">Description</h4>
                        <p className="text-sm bg-black/20 p-2 rounded">{agentConfig.description || 'No description provided'}</p>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-white/70 text-sm font-semibold mb-2">Personality</h4>
                        <p className="text-sm bg-black/20 p-2 rounded">{agentConfig.personality || 'No personality defined'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Wizard Navigation */}
            <div className="flex justify-between mt-6">
              <button 
                onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                className={`flex items-center px-5 py-2.5 rounded-lg transition-all duration-200 ${currentStep === 1 ? 'text-white/30 cursor-not-allowed' : 'text-white bg-black/20 hover:bg-black/30'}`}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </button>
              
              {currentStep < totalSteps ? (
                <button 
                  onClick={nextStep}
                  className="flex items-center px-5 py-2.5 rounded-lg bg-[#D4C6A1]/80 text-black hover:bg-[#D4C6A1] transition-all duration-200 font-medium"
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button 
                  onClick={createAgent}
                  className="flex items-center px-6 py-2.5 rounded-lg bg-[#D4C6A1] text-black hover:bg-[#BFB28F] transition-all duration-200 font-medium"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Agent'} <Check className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
            
            {/* Step Indicator */}
            <div className="flex justify-center mt-4">
              {Array.from({length: totalSteps}, (_, i) => i + 1).map(step => (
                <div 
                  key={step}
                  className={`w-2.5 h-2.5 rounded-full mx-1.5 transition-all duration-300 ${currentStep === step ? 'bg-[#D4C6A1]' : 'bg-white/20'}`}
                  onClick={() => setCurrentStep(step)}
                  style={{cursor: 'pointer'}}
                />
              ))}
            </div>
            
            {/* Validation Error */}
            {validationError && (
              <div className="mt-3 text-red-400 text-sm bg-red-400/10 p-2 rounded-lg border border-red-400/20 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {validationError}
              </div>
            )}
            
            {/* Creation Error */}
            {creationError && (
              <div className="mt-2 text-red-500 text-sm">
                {creationError}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
        

        
        {/* Advanced Configuration - Only shown in advanced mode */}
        {advancedMode && (
          <GlassCard className="w-full">
            <GlassCardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">Advanced Configuration</h2>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
                {/* Memory Management */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-2 border-b border-white/10 pb-1">Memory Management</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableRagKnowledge"
                        className="mr-2"
                        checked={agentConfig.memorySettings.enableRagKnowledge}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig,
                          memorySettings: {
                            ...agentConfig.memorySettings,
                            enableRagKnowledge: e.target.checked
                          }
                        })}
                      />
                      <label htmlFor="enableRagKnowledge" className="text-white/70 text-xs">
                        Enable RAG Knowledge
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableLoreMemory"
                        className="mr-2"
                        checked={agentConfig.memorySettings.enableLoreMemory}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig,
                          memorySettings: {
                            ...agentConfig.memorySettings,
                            enableLoreMemory: e.target.checked
                          }
                        })}
                      />
                      <label htmlFor="enableLoreMemory" className="text-white/70 text-xs">
                        Enable Lore Memory
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableDescriptionMemory"
                        className="mr-2"
                        checked={agentConfig.memorySettings.enableDescriptionMemory}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig,
                          memorySettings: {
                            ...agentConfig.memorySettings,
                            enableDescriptionMemory: e.target.checked
                          }
                        })}
                      />
                      <label htmlFor="enableDescriptionMemory" className="text-white/70 text-xs">
                        Enable Description Memory
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableDocumentsMemory"
                        className="mr-2"
                        checked={agentConfig.memorySettings.enableDocumentsMemory}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig,
                          memorySettings: {
                            ...agentConfig.memorySettings,
                            enableDocumentsMemory: e.target.checked
                          }
                        })}
                      />
                      <label htmlFor="enableDocumentsMemory" className="text-white/70 text-xs">
                        Enable Documents Memory
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Plugins Section */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-2 border-b border-white/10 pb-1">Plugins</h3>
                  <div className="space-y-2">
                    <p className="text-white/70 text-xs mb-2">
                      Enable plugins to give your agent additional capabilities.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="pluginSearch"
                          className="mr-2"
                          checked={agentConfig.plugins.includes('search')}
                          onChange={(e) => {
                            const updatedPlugins = e.target.checked 
                              ? [...agentConfig.plugins, 'search']
                              : agentConfig.plugins.filter(p => p !== 'search');
                            
                            setAgentConfig({
                              ...agentConfig,
                              plugins: updatedPlugins
                            });
                          }}
                        />
                        <label htmlFor="pluginSearch" className="text-white/70 text-xs">
                          Web Search
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="pluginWeather"
                          className="mr-2"
                          checked={agentConfig.plugins.includes('weather')}
                          onChange={(e) => {
                            const updatedPlugins = e.target.checked 
                              ? [...agentConfig.plugins, 'weather']
                              : agentConfig.plugins.filter(p => p !== 'weather');
                            
                            setAgentConfig({
                              ...agentConfig,
                              plugins: updatedPlugins
                            });
                          }}
                        />
                        <label htmlFor="pluginWeather" className="text-white/70 text-xs">
                          Weather
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="pluginCalendar"
                          className="mr-2"
                          checked={agentConfig.plugins.includes('calendar')}
                          onChange={(e) => {
                            const updatedPlugins = e.target.checked 
                              ? [...agentConfig.plugins, 'calendar']
                              : agentConfig.plugins.filter(p => p !== 'calendar');
                            
                            setAgentConfig({
                              ...agentConfig,
                              plugins: updatedPlugins
                            });
                          }}
                        />
                        <label htmlFor="pluginCalendar" className="text-white/70 text-xs">
                          Calendar
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="pluginNews"
                          className="mr-2"
                          checked={agentConfig.plugins.includes('news')}
                          onChange={(e) => {
                            const updatedPlugins = e.target.checked 
                              ? [...agentConfig.plugins, 'news']
                              : agentConfig.plugins.filter(p => p !== 'news');
                            
                            setAgentConfig({
                              ...agentConfig,
                              plugins: updatedPlugins
                            });
                          }}
                        />
                        <label htmlFor="pluginNews" className="text-white/70 text-xs">
                          News
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="pluginCrypto"
                          className="mr-2"
                          checked={agentConfig.plugins.includes('crypto')}
                          onChange={(e) => {
                            const updatedPlugins = e.target.checked 
                              ? [...agentConfig.plugins, 'crypto']
                              : agentConfig.plugins.filter(p => p !== 'crypto');
                            
                            setAgentConfig({
                              ...agentConfig,
                              plugins: updatedPlugins
                            });
                          }}
                        />
                        <label htmlFor="pluginCrypto" className="text-white/70 text-xs">
                          Cryptocurrency Data
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="pluginStocks"
                          className="mr-2"
                          checked={agentConfig.plugins.includes('stocks')}
                          onChange={(e) => {
                            const updatedPlugins = e.target.checked 
                              ? [...agentConfig.plugins, 'stocks']
                              : agentConfig.plugins.filter(p => p !== 'stocks');
                            
                            setAgentConfig({
                              ...agentConfig,
                              plugins: updatedPlugins
                            });
                          }}
                        />
                        <label htmlFor="pluginStocks" className="text-white/70 text-xs">
                          Stock Market Data
                        </label>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <label className="block text-white/70 text-xs mb-1">Custom Plugin ID</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          className="flex-1 bg-black/20 border border-white/10 text-white rounded-lg p-2 text-sm focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50"
                          placeholder="Enter plugin ID"
                          value={customPluginId}
                          onChange={(e) => setCustomPluginId(e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-[#D4C6A1]"
                          onClick={() => {
                            if (customPluginId && !agentConfig.plugins.includes(customPluginId)) {
                              setAgentConfig({
                                ...agentConfig,
                                plugins: [...agentConfig.plugins, customPluginId]
                              });
                              setCustomPluginId('');
                            }
                          }}
                          disabled={!customPluginId || agentConfig.plugins.includes(customPluginId)}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    
                    {/* Display active plugins */}
                    {agentConfig.plugins.length > 0 && (
                      <div className="mt-2">
                        <label className="block text-white/70 text-xs mb-1">Active Plugins</label>
                        <div className="flex flex-wrap gap-2">
                          {agentConfig.plugins.map(plugin => (
                            <div 
                              key={plugin} 
                              className="bg-[#D4C6A1]/10 text-[#D4C6A1] text-xs px-2 py-1 rounded-md flex items-center"
                            >
                              {plugin}
                              <button 
                                className="ml-2 text-white/50 hover:text-white"
                                onClick={() => {
                                  setAgentConfig({
                                    ...agentConfig,
                                    plugins: agentConfig.plugins.filter(p => p !== plugin)
                                  });
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Bio & Lore Section */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-2 border-b border-white/10 pb-1">Bio & Lore</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-white/70 text-xs mb-1">Bio (Core identity, character biography)</label>
                      <textarea 
                        className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-2 focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50 resize-none"
                        placeholder="Enter one bio statement per line (e.g. 'Expert in cryptocurrency trading')"
                        rows={3}
                        value={''}
                        onChange={(e) => {}}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-xs mb-1">Lore (Character background elements)</label>
                      <textarea 
                        className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-2 focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50 resize-none"
                        placeholder="Enter one lore statement per line (e.g. 'Created by a team of quant traders in 2023')"
                        rows={3}
                        value={''}
                        onChange={(e) => {}}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Style & Personality Section */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-2 border-b border-white/10 pb-1">Style & Personality</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-white/70 text-xs mb-1">Adjectives (one per line)</label>
                      <textarea 
                        className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-2 focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50 resize-none"
                        placeholder="Enter one adjective per line (e.g. 'Analytical')"
                        rows={2}
                        value={''}
                        onChange={(e) => {}}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-xs mb-1">Topics (one per line)</label>
                      <textarea 
                        className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-2 focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50 resize-none"
                        placeholder="Enter one topic per line (e.g. 'Technical Analysis')"
                        rows={2}
                        value={''}
                        onChange={(e) => {}}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Style Guidelines Section */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-2 border-b border-white/10 pb-1">Style Guidelines</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-white/70 text-xs mb-1">General Style (one per line)</label>
                      <textarea 
                        className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-2 focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50 resize-none"
                        placeholder="Enter one style guideline per line (e.g. 'Clear and concise communication')"
                        rows={2}
                        value={''}
                        onChange={(e) => {}}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-xs mb-1">Chat Style (one per line)</label>
                      <textarea 
                        className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-2 focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50 resize-none"
                        placeholder="Enter one chat style guideline per line (e.g. 'Engage with curiosity')"
                        rows={2}
                        value={''}
                        onChange={(e) => {}}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-xs mb-1">Post Style (one per line)</label>
                      <textarea 
                        className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-2 focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50 resize-none"
                        placeholder="Enter one post style guideline per line (e.g. 'Keep posts informative')"
                        rows={2}
                        value={''}
                        onChange={(e) => {}}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Examples Section */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-2 border-b border-white/10 pb-1">Examples</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-white/70 text-xs mb-1">Message Examples (one per line)</label>
                      <textarea 
                        className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-2 focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50 resize-none"
                        placeholder="Enter example user messages (e.g. 'What do you think about Bitcoin's current price action?')"
                        rows={2}
                        value={''}
                        onChange={(e) => {}}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-xs mb-1">Post Examples (one per line)</label>
                      <textarea 
                        className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-2 focus:ring-[#BFB28F]/50 focus:border-[#BFB28F]/50 resize-none"
                        placeholder="Enter example social posts (e.g. 'BTC analysis: Support at $45K, resistance at $48K...')"
                        rows={2}
                        value={''}
                        onChange={(e) => {}}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Additional Client Types */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-2 border-b border-white/10 pb-1">Additional Clients</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="advancedEnableDiscord"
                        className="mr-2"
                        checked={agentConfig.clients.discord}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig, 
                          clients: {
                            ...agentConfig.clients,
                            discord: e.target.checked
                          }
                        })}
                      />
                      <label htmlFor="advancedEnableDiscord" className="text-white/70 text-xs flex items-center">
                        <DiscordLogo className="w-3 h-3 mr-1 text-white/70" /> Discord
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="advancedEnableTwitter"
                        className="mr-2"
                        checked={agentConfig.clients.twitter}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig, 
                          clients: {
                            ...agentConfig.clients,
                            twitter: e.target.checked
                          },
                          enableTwitter: e.target.checked
                        })}
                      />
                      <label htmlFor="advancedEnableTwitter" className="text-white/70 text-xs flex items-center">
                        <XLogo className="w-3 h-3 mr-1 text-white/70" /> X
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableTelegram"
                        className="mr-2"
                        checked={agentConfig.clients.telegram}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig, 
                          clients: {
                            ...agentConfig.clients,
                            telegram: e.target.checked
                          }
                        })}
                      />
                      <label htmlFor="enableTelegram" className="text-white/70 text-xs">
                        Telegram
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableSlack"
                        className="mr-2"
                        checked={agentConfig.clients.slack}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig, 
                          clients: {
                            ...agentConfig.clients,
                            slack: e.target.checked
                          }
                        })}
                      />
                      <label htmlFor="enableSlack" className="text-white/70 text-xs">
                        Slack
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableSimsai"
                        className="mr-2"
                        checked={agentConfig.clients.simsai}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig, 
                          clients: {
                            ...agentConfig.clients,
                            simsai: e.target.checked
                          }
                        })}
                      />
                      <label htmlFor="enableSimsai" className="text-white/70 text-xs">
                        SimsAI
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export { CreateAgent };
