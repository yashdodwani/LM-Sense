// Purpose: Pipeline configuration page. Renders the full pipeline form
// with Simple/Advanced mode toggle and save functionality.

import { PipelineForm } from "@/components/pipeline/PipelineForm";

export default function PipelinePage() {
  return (
    <div className="space-y-5 p-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pipeline Configuration</h2>
        <p className="text-sm text-gray-500">
          Configure the three-layer debiasing pipeline — changes take effect on the next request
        </p>
      </div>

      <PipelineForm />
    </div>
  );
}
