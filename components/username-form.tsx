"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePersistedUsername } from "@/lib/use-persisted-username";

interface UsernameFormProps {
  onSubmit: (username: string) => void;
  initialUsername?: string;
}

export function UsernameForm({
  onSubmit,
  initialUsername = "",
}: UsernameFormProps) {
  const [value, setValue] = useState(initialUsername);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const { save, clear } = usePersistedUsername();

  const handleLoad = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setValidationMessage("Please enter a username.");
      return;
    }
    setValidationMessage(null);
    onSubmit(trimmed);
  };

  const handleSave = () => {
    const success = save(value);
    if (!success) {
      setValidationMessage("Please enter a username to save.");
    } else {
      setValidationMessage(null);
    }
  };

  const handleClear = () => {
    clear();
    setValue("");
    setValidationMessage(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="BGG username"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (validationMessage) setValidationMessage(null);
          }}
          aria-label="BGG username"
          aria-invalid={validationMessage !== null}
          aria-describedby={
            validationMessage ? "username-validation" : undefined
          }
        />
        <Button onClick={handleLoad}>Load</Button>
        <Button variant="outline" onClick={handleSave}>
          Save
        </Button>
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
      </div>
      {validationMessage && (
        <p
          id="username-validation"
          role="alert"
          className="text-sm text-destructive"
        >
          {validationMessage}
        </p>
      )}
    </div>
  );
}
