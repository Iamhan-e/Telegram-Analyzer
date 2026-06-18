"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";

interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmString: string;
  variant?: "danger";
}

export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmString,
  variant = "danger",
}: ConfirmProps) {
  const [value, setValue] = useState("");
  const isMatch = value === confirmString;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-[12px] text-text2 mb-4">{body}</p>
      <p className="font-mono text-[10px] text-text3 mb-2">
        Type <span className="text-red font-semibold">{confirmString}</span> to confirm
      </p>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={confirmString}
      />
      <div className="flex gap-2 mt-4 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={variant}
          size="sm"
          disabled={!isMatch}
          onClick={onConfirm}
        >
          {confirmString}
        </Button>
      </div>
    </Modal>
  );
}

export type { ConfirmProps };
