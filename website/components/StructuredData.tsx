import Script from 'next/script'

interface StructuredDataProps {
  type?: 'organization' | 'product' | 'article' | 'faq'
  data?: any
}

export default function StructuredData({ type = 'organization', data }: StructuredDataProps) {
  const getStructuredData = () => {
    switch (type) {
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "SafePrompt",
          "url": "https://safeprompt.dev",
          "logo": "https://safeprompt.dev/logo.png",
          "description": "Developer-first API service that prevents prompt injection attacks in AI applications",
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "url": "https://safeprompt.dev/contact"
          },
          "sameAs": [
            "https://github.com/ianreboot/safeprompt"
          ]
        }

      case 'product':
        return {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "SafePrompt API",
          "applicationCategory": "SecurityApplication",
          "operatingSystem": "All",
          "description": "Stop prompt injection in one line of code. Fast, simple, transparent API for AI security.",
          "url": "https://safeprompt.dev",
          "author": {
            "@type": "Organization",
            "name": "SafePrompt"
          },
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "priceValidUntil": "2025-12-31",
            "availability": "https://schema.org/InStock",
            "description": "Free tier: 1,000 API calls/month"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "127",
            "bestRating": "5",
            "worstRating": "1"
          },
          "featureList": [
            "Prompt injection detection",
            "Multi-layer validation",
            "Sub-100ms response time",
            "99.9% uptime SLA",
            "RESTful API",
            "Real-time monitoring"
          ]
        }

      case 'article':
        return {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": data?.title || "SafePrompt Blog",
          "description": data?.excerpt || "",
          "author": {
            "@type": "Organization",
            "name": "SafePrompt Team"
          },
          "datePublished": data?.date || new Date().toISOString(),
          "dateModified": data?.modified || data?.date || new Date().toISOString(),
          "image": "https://safeprompt.dev/og-image.png",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": data?.url || "https://safeprompt.dev/blog"
          },
          "publisher": {
            "@type": "Organization",
            "name": "SafePrompt",
            "logo": {
              "@type": "ImageObject",
              "url": "https://safeprompt.dev/logo.png"
            }
          }
        }

      case 'faq':
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is prompt injection?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Prompt injection is a security vulnerability where attackers manipulate AI systems by inserting malicious instructions into user inputs, causing the AI to perform unintended actions."
              }
            },
            {
              "@type": "Question",
              "name": "How fast is SafePrompt?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "SafePrompt processes requests in under 100ms, with regex validation taking only 5ms and AI validation completing in 50-100ms."
              }
            },
            {
              "@type": "Question",
              "name": "Is there a free tier?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, SafePrompt offers a free tier with 1,000 API calls per month, perfect for testing and small projects."
              }
            },
            {
              "@type": "Question",
              "name": "How do I integrate SafePrompt?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Integration is simple - just make a POST request to our API endpoint with your prompt. We provide SDKs for popular languages and comprehensive documentation."
              }
            },
            {
              "@type": "Question",
              "name": "What makes SafePrompt different?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "SafePrompt is developer-first with transparent pricing, no sales calls, simple integration, and fast response times. We focus on making security accessible, not enterprise complexity."
              }
            }
          ]
        }

      default:
        return null
    }
  }

  const structuredData = getStructuredData()

  if (!structuredData) return null

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
      strategy="afterInteractive"
    />
  )
}