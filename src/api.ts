import request from 'umi-request';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

export const getFigmaFile = (fileKey: string) => {
  return request.get(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: {
      'X-FIGMA-TOKEN': FIGMA_TOKEN,
    }
  });
}