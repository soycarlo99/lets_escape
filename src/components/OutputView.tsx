import React from "react";

interface OutputViewProps {
  output: string | React.ReactNode;
}

export const OutputView: React.FC<OutputViewProps> = ({ output }) => {
  return (
    <div className="output-container">
      <div id="output" className="output-header">
        Output:
      </div>
      <div className="output">
        {typeof output === "string" ? <pre>{output}</pre> : output}
      </div>
    </div>
  );
};

