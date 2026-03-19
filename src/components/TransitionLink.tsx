"use client";

import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "./TransitionProvider";
import React from "react";

interface TransitionLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function TransitionLink({ children, href, className, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter();
  const { triggerTransition } = useTransition();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    
    // Ignore trigger if opening in new tab, or if it's an anchor/external link
    const strHref = href.toString();
    if (e.ctrlKey || e.metaKey || strHref.startsWith("http") || strHref.startsWith("#")) {
      return;
    }

    e.preventDefault();
    triggerTransition(strHref);
    
    // Attendre que le rideau se ferme avant de rediriger
    setTimeout(() => {
      router.push(strHref);
    }, 700);
  };

  return (
    <Link href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </Link>
  );
}
