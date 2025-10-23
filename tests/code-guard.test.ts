/**
 * 코드 가드 테스트
 * 
 * 생성된 코드의 안전성 및 품질을 검증하는 테스트 케이스
 */

import { describe, it, expect } from "@jest/globals";

/**
 * 코드 검증 함수 (실제 API에서 사용하는 것과 동일)
 */
function validateGeneratedCode(code: string): { valid: boolean; reason?: string } {
  // 외부 이미지 URL 금지
  if (/(?:src|href)=["'](?:https?:\/\/|\/\/)/.test(code)) {
    return { valid: false, reason: "External image or link URLs are not allowed" };
  }

  // fetch, axios 등 네트워크 호출 금지
  if (/\b(?:fetch|axios|XMLHttpRequest)\b/.test(code)) {
    return { valid: false, reason: "Network requests are not allowed" };
  }

  // dangerouslySetInnerHTML 금지
  if (/dangerouslySetInnerHTML/.test(code)) {
    return { valid: false, reason: "dangerouslySetInnerHTML is not allowed" };
  }

  // eval, Function 등 동적 코드 실행 금지
  if (/\b(?:eval|Function)\s*\(/.test(code)) {
    return { valid: false, reason: "Dynamic code execution is not allowed" };
  }

  // <script> 태그 금지
  if (/<script/i.test(code)) {
    return { valid: false, reason: "Script tags are not allowed" };
  }

  // export default 컴포넌트 확인
  if (!/export\s+default\s+function\s+\w+/.test(code)) {
    return { valid: false, reason: "Code must include 'export default function ComponentName()'" };
  }

  return { valid: true };
}

describe("Code Guard Tests", () => {
  describe("Security Validations", () => {
    it("should reject code with external image URLs", () => {
      const badCode = `
        export default function Component() {
          return <img src="https://example.com/image.png" />;
        }
      `;

      const result = validateGeneratedCode(badCode);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("External image");
    });

    it("should reject code with fetch calls", () => {
      const badCode = `
        export default function Component() {
          const data = await fetch('/api/data');
          return <div>Data</div>;
        }
      `;

      const result = validateGeneratedCode(badCode);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Network requests");
    });

    it("should reject code with dangerouslySetInnerHTML", () => {
      const badCode = `
        export default function Component() {
          return <div dangerouslySetInnerHTML={{ __html: '<script>alert("xss")</script>' }} />;
        }
      `;

      const result = validateGeneratedCode(badCode);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("dangerouslySetInnerHTML");
    });
  });

  describe("Structure Validations", () => {
    it("should accept valid component with export default", () => {
      const goodCode = `
        export default function MyComponent() {
          return (
            <div className="bg-primary text-primary-foreground p-4">
              <h1>Hello World</h1>
            </div>
          );
        }
      `;

      const result = validateGeneratedCode(goodCode);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should reject code without export default", () => {
      const badCode = `
        function MyComponent() {
          return <div>Hello</div>;
        }
      `;

      const result = validateGeneratedCode(badCode);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("export default");
    });

    it("should accept code with React hooks", () => {
      const goodCode = `
        export default function Counter() {
          const [count, setCount] = useState(0);
          
          useEffect(() => {
            console.log('Count changed:', count);
          }, [count]);

          return (
            <button onClick={() => setCount(count + 1)}>
              Count: {count}
            </button>
          );
        }
      `;

      const result = validateGeneratedCode(goodCode);
      expect(result.valid).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty code", () => {
      const result = validateGeneratedCode("");
      expect(result.valid).toBe(false);
    });

    it("should handle code with comments containing URLs", () => {
      const codeWithComment = `
        // Image from https://example.com/image.png
        export default function Component() {
          return <div>Hello</div>;
        }
      `;

      // 코멘트의 URL은 허용 (코드에서만 체크)
      // 현재 구현은 간단한 정규식으로 src/href 속성만 체크하므로 코멘트는 통과
      const result = validateGeneratedCode(codeWithComment);
      expect(result.valid).toBe(true);
    });

    it("should reject code with eval", () => {
      const badCode = `
        export default function Component() {
          eval('alert("xss")');
          return <div>Bad</div>;
        }
      `;

      const result = validateGeneratedCode(badCode);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Dynamic code execution");
    });

    it("should reject code with script tags", () => {
      const badCode = `
        export default function Component() {
          return (
            <div>
              <script>alert('xss')</script>
            </div>
          );
        }
      `;

      const result = validateGeneratedCode(badCode);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Script tags");
    });
  });

  describe("Performance Tests", () => {
    it("should validate code in under 100ms", () => {
      const longCode = `
        export default function LargeComponent() {
          return (
            <div>
              ${Array(100).fill("<p>Line</p>").join("\n")}
            </div>
          );
        }
      `;

      const startTime = Date.now();
      validateGeneratedCode(longCode);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });
  });
});

describe("Regression Tests", () => {
  const regressionPrompts = [
    "Create a simple button component",
    "Build a login form with email and password",
    "Design a user profile card",
    "Make a responsive navigation bar",
    "Create a pricing table with 3 tiers",
    "Build a testimonial section",
    "Design a feature grid with icons",
    "Create a newsletter signup form",
    "Build a footer with links",
    "Design a hero section with CTA",
  ];

  it("should have 10 regression test prompts defined", () => {
    expect(regressionPrompts).toHaveLength(10);
    regressionPrompts.forEach((prompt) => {
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
    });
  });

  it("regression prompts should be descriptive", () => {
    regressionPrompts.forEach((prompt) => {
      // 최소 10자 이상
      expect(prompt.length).toBeGreaterThan(10);
      
      // 의미 있는 단어 포함 확인
      const meaningfulWords = ["create", "build", "design", "make"];
      const hasAction = meaningfulWords.some((word) =>
        prompt.toLowerCase().includes(word)
      );
      expect(hasAction).toBe(true);
    });
  });
});

