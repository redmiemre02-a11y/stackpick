import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p>
        This comparison may not be published yet. <Link href="/">Browse all categories →</Link>
      </p>
    </>
  );
}
