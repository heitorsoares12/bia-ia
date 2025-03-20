export let assistantId = "asst_LTs4N9cLNB566TDDMV7ojIza"; // set your assistant ID here

if (assistantId === "") {
  assistantId = process.env.OPENAI_ASSISTANT_ID || assistantId;
}