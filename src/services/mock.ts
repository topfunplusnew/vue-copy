// @ts-ignore
import Mock from "mockjs";

// 模拟数据结构（和 Note 接口一致）
const mockNotes = Mock.mock({
  "data|5-8": [
    {
      "id|+1": 1,
      "eventType": "presentation",
      "time": "@integer(1,10) days ago",
      "subject": "@word(2,5)-@word(2,5) Presentation",
      "content":
        "The rapid adoption of @word(5) Models in unmanned systems has significantly enhanced the semantic understanding and autonomous task execution capabilities of @word(5) systems..."
    }
  ]
});

// 模拟接口
Mock.mock("/api/notes", "get", () => {
  return {
    code: 200,
    message: "success",
    data: mockNotes.data
  };
});

console.log("✅ Mock service is running!");
