"""
Embedding Projection.
"""
import torch
class EmbeddingProjector:
    def project(self, embedding: torch.Tensor, bias_axis: torch.Tensor) -> torch.Tensor:
        raise NotImplementedError
