import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PacsViewer = () => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <a href="/" className="absolute top-4 left-4 z-50">
        <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm border-border shadow-md">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au site
        </Button>
      </a>
      <iframe
        src="/pacs/index.html"
        title="Nero-IRM-viewer"
        className="w-full h-full border-0"
        allow="fullscreen"
      />
    </div>
  );
};

export default PacsViewer;
