import * as React from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  // Add props for Ruby's messages and user input here
};

export function RubySidebar({ isOpen, onClose }: Props) {
  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 bg-gray-800 text-white shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Ruby Chat</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          &times;
        </button>
      </div>
      <div className="p-4">
        {/* Chat messages will go here */}
        <p>Hello, I am Ruby. How can I help you with your schedule?</p>
      </div>
      <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-700">
        {/* User input will go here */}
        <input
          type="text"
          placeholder="Ask Ruby a question..."
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}
