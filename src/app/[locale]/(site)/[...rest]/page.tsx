import { notFound } from "next/navigation";

// Always renders the 404 page, so there is nothing for instant-navigation validation to check.
export const instant = false;

/** Unknown paths render the localized 404 inside the site layout. */
export default function CatchAll() {
  notFound();
}
