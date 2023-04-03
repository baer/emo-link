const json = function json(data: any, status?: number) {
  const json = JSON.stringify(data, null, 2);
  return new Response(json, {
    status: status || 200,
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  json,
};
