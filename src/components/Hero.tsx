import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, Zap, Upload, Download, Share2, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const Hero = () => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Upload,
      title: "Smart Upload",
      description: "Drag & drop transcripts, PDFs, or paste text directly"
    },
    {
      icon: Zap,
      title: "AI Processing",
      description: "Instant meeting minutes generation with OpenRouter AI"
    },
    {
      icon: Share2,
      title: "Easy Sharing",
      description: "Share with team members and collaborate seamlessly"
    },
    {
      icon: Download,
      title: "Export Options",
      description: "Export to PDF, DOCX, or TXT formats"
    }
  ];

  const floatingIcons = [
    { icon: FileText, delay: 0, x: 10, y: 15 },
    { icon: Users, delay: 0.5, x: -10, y: 10 },
    { icon: Calendar, delay: 1, x: 15, y: -10 },
    { icon: Clock, delay: 1.5, x: -15, y: -15 }
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center hero-glow cinematic-vignette overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingIcons.map(({ icon: Icon, delay, x, y }, index) => (
          <motion.div
            key={index}
            className="absolute text-primary/20"
            style={{
              left: `${20 + index * 20}%`,
              top: `${30 + index * 10}%`,
            }}
            animate={{
              x: [0, x, 0],
              y: [0, y, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Icon className="w-16 h-16 opacity-30" />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-poppins font-bold mb-6 animate-fade-in">
            <span className="gradient-text text-glow">Your AI Meeting</span>
            <br />
            <span className="text-foreground">Assistant</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Transform meeting transcripts into structured minutes with the power of AI. 
            Upload, process, and share professional meeting summaries in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 glow-box film-button animate-pulse-glow"
            >
              <Upload className="mr-2 h-5 w-5" />
              Try Now - Upload Transcript
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-glow hover:bg-primary/10"
            >
              <FileText className="mr-2 h-5 w-5" />
              View Demo
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              className="glow-box film-dissolve bg-card/80 backdrop-blur-sm border-glow hover:shadow-glow transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className={`p-3 rounded-lg bg-gradient-to-r from-primary to-secondary transition-transform duration-300 ${
                    hoveredFeature === index ? 'scale-110' : 'scale-100'
                  }`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="font-poppins font-semibold text-lg mb-2 gradient-text">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">10x</div>
            <div className="text-muted-foreground">Faster Processing</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">95%</div>
            <div className="text-muted-foreground">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">1000+</div>
            <div className="text-muted-foreground">Meetings Processed</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;