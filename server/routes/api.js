const express = require('express');
const router = express.Router();
const PaperService = require('../services/paperService');
const AIService = require('../services/aiService');

const paperService = new PaperService();
const aiService = new AIService();

router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Get papers from arXiv
    const papers = await paperService.searchPapers(query);
    
    // Store papers in RAG system
    await Promise.all(papers.map(paper => aiService.processAndStoreDocument(paper)));
    
    // Generate AI insights
    const insights = await aiService.generateResearchInsights(papers);
    
    // Perform semantic search
    const semanticResults = await aiService.semanticSearch(query);
    
    res.json({
      papers,
      insights,
      semanticResults
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Update client/src/App.jsx to display insights
function App() {
  const [papers, setPapers] = React.useState([]);
  const [insights, setInsights] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setPapers(data.papers);
      setInsights(data.insights);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <SearchBar onSearch={handleSearch} />
        {loading && <LoadingSpinner />}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {insights && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI Insights
            </Typography>
            <Typography variant="body1">
              {insights}
            </Typography>
          </Paper>
        )}
        {papers.map((paper) => (
          <PaperCard key={paper.id} paper={paper} />
        ))}
      </Container>
    </ThemeProvider>
  );
}