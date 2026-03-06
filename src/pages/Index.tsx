import { Link } from 'react-router-dom';
import {
  Shield,
  Camera,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Package,
  Users,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const Index = () => {
  const stats = [
    { value: '50K+', label: 'Products Verified', icon: FileCheck },
    { value: '99.2%', label: 'Accuracy Rate', icon: CheckCircle },
    { value: '10K+', label: 'Fake Products Detected', icon: AlertTriangle },
    { value: '25K+', label: 'Active Users', icon: Users },
  ];

  const features = [
    {
      icon: Camera,
      title: 'Image-Based Verification',
      description: 'Simply upload a photo of the product label and our OCR technology extracts and verifies FSSAI details.'
    },
    {
      icon: Shield,
      title: 'Trust Score System',
      description: 'Every food product receives a trust score (0-100) based on FSSAI license validation and multiple checks.'
    },
    {
      icon: ShieldCheck,
      title: 'Database Verification',
      description: 'Products are verified against our FSSAI license database and blacklisted brand registry.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-hero opacity-95" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />

          <div className="relative container mx-auto px-4 py-20 md:py-32">
            <div className="max-w-3xl mx-auto text-center text-white">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Trusted by 25,000+ users across India</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
                Verify Food Product Authenticity with FSSAI
              </h1>

              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Protect yourself from counterfeit food products. Upload product labels and instantly verify
                FSSAI licenses, manufacturer details, and batch information.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl">
                  <Link to="/verify">
                    <Camera className="w-5 h-5 mr-2" />
                    Verify a Product
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Link to="/products">
                    View Verified Products
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Stats Section */}
        <section className="py-12 -mt-12 relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="border-none shadow-lg">
                  <CardContent className="p-6 text-center">
                    <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our verification system uses advanced OCR technology and FSSAI database
                to authenticate food products and protect consumers.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                      <feature.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What We Verify Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                What We Verify
              </h2>
              <p className="text-muted-foreground">
                Comprehensive FSSAI-based verification for packaged food products.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card className="overflow-hidden">
                <div className="h-32 gradient-hero flex items-center justify-center">
                  <Package className="w-16 h-16 text-white/80" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Food Product Authentication</h3>
                  <p className="text-muted-foreground mb-4">
                    Verify FSSAI licenses, manufacturer details, batch numbers, and license dates for packaged food items.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>FSSAI License Number Verification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>Brand Name Detection via OCR</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>Blacklisted Brand Detection</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>Manufacturer Authentication</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <Card className="overflow-hidden border-none shadow-2xl">
              <div className="relative gradient-hero p-8 md:p-12">
                <div className="relative z-10 text-center text-white">
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                    Ready to Verify Your Food Products?
                  </h2>
                  <p className="text-white/80 mb-6 max-w-xl mx-auto">
                    Start protecting yourself from counterfeit food products today.
                    It's quick, easy, and free.
                  </p>
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                    <Link to="/verify">
                      <Camera className="w-5 h-5 mr-2" />
                      Verify Now
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
