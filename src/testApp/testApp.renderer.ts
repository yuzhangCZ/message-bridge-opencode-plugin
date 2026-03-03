export class TestAppRenderer {
  render(markdown: string): string {
    // 对于 testApp，直接将 markdown 作为文本消息发送
    // 后续可以根据需要扩展为支持富文本或卡片消息
    return markdown;
  }
}
