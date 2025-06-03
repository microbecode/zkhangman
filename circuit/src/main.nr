fn main(
    // The target word (private)
    target_word: [u32; 10],
    // The guessed word (public)
    guessed_word: [u32; 10],
)  {
    // Check that the guessed word matches the target word
    // Only check up to word_length characters
    for i in 0..4 {
        assert(target_word[i as u32] == guessed_word[i as u32]);
    }
}