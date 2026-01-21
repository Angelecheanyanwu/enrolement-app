"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, UserCheck, UserPlus, Shield, Zap, Lock, ChevronRight } from "lucide-react";

const HomePage = () => {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure Authentication",
      description: "Multi-layered biometric security for maximum protection"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Fast Processing",
      description: "Quick enrollment and verification in seconds"
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: "Data Privacy",
      description: "Your biometric data is encrypted and protected"
    }
  ];

  const handleEnroll = () => {
    router.push("/enroll");
  };

  const handleVerify = () => {
    router.push("/verify");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 p-2 rounded-lg">
                <Fingerprint className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">BIOID System</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Secure Biometric Identity Management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Shield className="h-4 w-4" />
                <span>Trusted by 10,000+ Organizations</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Identity,
                <span className="text-green-600"> Secured</span>
              </h2>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                Advanced biometric enrollment and verification system. Fast, secure, and reliable identity management at your fingertips.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleEnroll}
                  className="group bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-green-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <UserPlus className="h-6 w-6" />
                  <span>Enroll Now</span>
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button
                  onClick={handleVerify}
                  className="group bg-white text-green-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl border-2 border-green-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <UserCheck className="h-6 w-6" />
                  <span>Verify Identity</span>
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-200">
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-green-600">99.9%</div>
                  <div className="text-sm text-gray-600 mt-1">Accuracy</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-green-600">&lt;3s</div>
                  <div className="text-sm text-gray-600 mt-1">Verification</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-green-600">24/7</div>
                  <div className="text-sm text-gray-600 mt-1">Available</div>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative z-10">
                <div className="bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-green-100 p-4 rounded-full">
                      <Fingerprint className="h-12 w-12 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Biometric ID</div>
                      <div className="text-xl font-bold text-gray-900">Secure Access</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse"></div>
                      <div className="text-sm text-gray-700">Fingerprint Authentication</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="text-sm text-gray-700">Facial Recognition</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      <div className="text-sm text-gray-700">Personal Data Protection</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-30 -z-10"></div>
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-green-300 rounded-full blur-3xl opacity-20 -z-10"></div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose BIOID?
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              State-of-the-art biometric technology designed for your security and convenience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(feature.title)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border-2 transition-all cursor-pointer ${
                  hoveredCard === feature.title
                    ? 'border-green-600 shadow-xl transform scale-105'
                    : 'border-green-100 shadow-md'
                }`}
              >
                <div className={`inline-flex p-4 rounded-xl mb-4 transition-colors ${
                  hoveredCard === feature.title ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'
                }`}>
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h4>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 sm:py-20 bg-gradient-to-br from-green-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple 3-Step Process
            </h3>
            <p className="text-lg text-gray-600">
              Getting started is quick and easy
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              { step: "01", title: "Capture Fingerprints", desc: "Scan all your fingerprints using our secure scanner" },
              { step: "02", title: "Enter Details", desc: "Provide your personal information securely" },
              { step: "03", title: "Face Recognition", desc: "Complete enrollment with facial recognition" }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-6xl font-bold text-green-100 mb-4">{item.step}</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h4>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
                {index < 2 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 h-8 w-8 text-green-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Fingerprint className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-xl">BIOID System</div>
                <div className="text-sm text-gray-400">Secure Identity Management</div>
              </div>
            </div>
            
            <div className="text-center md:text-right text-sm text-gray-400">
              <p>&copy; 2026 BIOID System. All rights reserved.</p>
              <p className="mt-1 font-bold">Developed by Inspired Technologies</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;