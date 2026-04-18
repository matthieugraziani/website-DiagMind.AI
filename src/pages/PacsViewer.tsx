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
    <div className="flex flex-col w-full h-screen bg-background">
      <div className="p-3 border-b border-border bg-background">
        <a href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au site
          </Button>
        </a>
      </div>
      <iframe
        src="/pacs/index.html"
        title="Neuro-IRM-viewer"
        className="w-full flex-1 border-0"
        allow="fullscreen"
      />
    </div>
  );
};

export default PacsViewer;
